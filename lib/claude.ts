// Server-only helpers for talking to Claude. Never import this from client code.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { FILE_TAGS, MAX_TOTAL_CHARS, type Material } from "@/lib/types";

export const MODEL = "claude-sonnet-5-5";

const BETAS = ["server-side-fallback-2026-07-01"];

/** An error whose message is safe to show the user. */
export class FriendlyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new FriendlyError(
      500,
      "The server is missing its Anthropic API key. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.",
    );
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// ---------- request validation ----------

export const MaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.enum(FILE_TAGS),
  text: z.string(),
});

export const ConceptSchema = z.object({
  name: z.string(),
  definition: z.string(),
  prerequisites: z.array(z.string()),
  testedOnPriorExam: z.boolean(),
  pastMistakes: z.array(z.string()),
});

export const ChatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

/** Parse and validate a JSON request body; throws FriendlyError(400) on failure. */
export async function readBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new FriendlyError(400, "The request wasn't valid JSON. Please refresh the page and try again.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    console.error("Invalid request body:", result.error);
    throw new FriendlyError(400, "The request was missing some information. Please refresh the page and try again.");
  }
  return result.data;
}

/** Throws FriendlyError(413) if the materials (plus extra text) are too large. */
export function checkSize(materials: Material[], extra = 0): void {
  const total = materials.reduce((n, m) => n + m.text.length + m.name.length, 0) + extra;
  if (total > MAX_TOTAL_CHARS) {
    throw new FriendlyError(
      413,
      `Your materials are too long (${total.toLocaleString()} characters; the limit is ${MAX_TOTAL_CHARS.toLocaleString()}). Remove a file or two and try again.`,
    );
  }
}

export function hasText(materials: Material[]): boolean {
  return materials.some((m) => m.text.trim().length > 0);
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Format materials as <material> blocks, skipping empty ones. */
export function formatMaterials(materials: Material[]): string {
  const blocks = materials
    .filter((m) => m.text.trim().length > 0)
    .map(
      (m) =>
        `<material name="${escapeAttr(m.name)}" type="${escapeAttr(m.tag)}">\n${m.text.trim()}\n</material>`,
    );
  return `<materials>\n${blocks.join("\n\n")}\n</materials>`;
}

// ---------- Claude calls ----------

type Msg = { role: "user" | "assistant"; content: string };

function checkStopReason(stop: string | null | undefined): void {
  if (stop === "refusal") {
    throw new FriendlyError(
      422,
      "Claude declined to process this content. Try removing any material that isn't course-related and try again.",
    );
  }
  if (stop === "max_tokens") {
    throw new FriendlyError(502, "Claude's answer got cut off. Please try again (shorter materials may help).");
  }
}

/** Structured-output call; returns the parsed object. */
export async function callStructured<S extends z.ZodType>(
  schema: S,
  system: string,
  messages: Msg[],
): Promise<z.infer<S>> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
    system,
    messages,
  });
  checkStopReason(response.stop_reason);
  if (response.parsed_output == null) {
    throw new FriendlyError(502, "Claude's answer came back in an unexpected format. Please try again.");
  }
  return response.parsed_output as z.infer<S>;
}

/** Plain-text call; returns the joined text blocks. */
export async function callText(system: string, messages: Msg[]): Promise<string> {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort: "low" },
    system,
    messages,
  });
  checkStopReason(response.stop_reason);
  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  if (!text) throw new FriendlyError(502, "Claude didn't say anything that time. Please try again.");
  return text;
}

// ---------- error mapping ----------

export function errorResponse(err: unknown): NextResponse<{ error: string }> {
  if (err instanceof FriendlyError) {
    if (err.status >= 500) console.error(err.message);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("Claude request failed:", err);
  const json = (error: string, status: number) => NextResponse.json({ error }, { status });

  if (err instanceof Anthropic.AuthenticationError) {
    return json("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.local and restart the dev server.", 500);
  }
  if (err instanceof Anthropic.RateLimitError) {
    return json("Claude is busy right now — wait a moment and try again.", 429);
  }
  if (err instanceof Anthropic.BadRequestError) {
    return json(
      "Claude couldn't process that request — your materials may be too long. Try removing a file or two and try again.",
      400,
    );
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return json("Couldn't reach Claude. Check your internet connection and try again.", 502);
  }
  if (err instanceof Anthropic.APIError) {
    const status = typeof err.status === "number" ? err.status : 502;
    if (status === 529 || status >= 500) {
      return json("Claude is having trouble right now. Please try again in a moment.", 502);
    }
    return json(`Something went wrong talking to Claude (error ${status}). Please try again.`, 502);
  }
  if (err instanceof Anthropic.AnthropicError && err.message.startsWith("Failed to parse structured output")) {
    return json("Claude's answer came back incomplete. Please try again.", 502);
  }
  return json("Something went wrong on the server. Please try again.", 500);
}
