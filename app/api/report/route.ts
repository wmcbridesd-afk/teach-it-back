import { NextResponse } from "next/server";
import * as z from "zod/v4";
import {
  ChatTurnSchema,
  ConceptSchema,
  FriendlyError,
  MaterialSchema,
  callStructured,
  checkSize,
  errorResponse,
  formatMaterials,
  readBody,
} from "@/lib/claude";
import type { ChatTurn, Concept, Report, ReportItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  topic: z.string(),
  materials: z.array(MaterialSchema),
  concepts: z.array(ConceptSchema),
  transcript: z.array(ChatTurnSchema),
});

const OutputSchema = z.object({
  overall: z.string(),
  items: z.array(
    z.object({
      concept: z.string(),
      status: z.enum(["green", "yellow", "red"]),
      yourQuote: z.string(),
      materialSays: z.string(),
      rootCause: z.string(),
      fix: z.string(),
    }),
  ),
});

const SYSTEM = `You are an expert, encouraging tutor grading a "teach it back" session. The student (labelled TEACHER in the transcript) explained a topic to a curious AI student. Produce a "Mistake Map": an honest, specific assessment of how well the student understands each key concept, grounded in their course materials.

For EACH key concept (use exactly the given names, in exactly the given order, one item per concept):
- status:
  - "green" = explained well and correctly.
  - "yellow" = partial, vague, or only implied.
  - "red" = missing (never addressed) or wrong.
- yourQuote: a VERBATIM quote copied exactly from the TEACHER's messages that is most relevant to this concept. Use "" if the teacher never mentioned it. Never quote the AI student.
- materialSays: what the materials say about this concept — concise and grounded in the materials.
- rootCause: the likely root cause of the gap. When applicable, name a shaky prerequisite concept. For green, a short note like "None — solid."
- fix: exactly 2 sentences of specific, actionable guidance.

PAST MISTAKES RULE: some concepts list the student's past mistakes from graded work. Those count toward yellow/red. A concept with past mistakes can be green ONLY if the explanation explicitly and correctly addresses the previously-mistaken point; otherwise it is at least yellow. If the explanation repeats the past mistake, it is red.

overall: a 2–3 sentence summary of the student's understanding that names the top priority to study next (favor red concepts, those tested on prior exams, and those with past mistakes).`;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatConcepts(concepts: Concept[]): string {
  return concepts
    .map((c, i) => {
      const lines = [`${i + 1}. ${c.name}: ${c.definition}`];
      if (c.prerequisites.length) lines.push(`   prerequisites: ${c.prerequisites.join(", ")}`);
      lines.push(`   tested on prior exam: ${c.testedOnPriorExam ? "yes" : "no"}`);
      lines.push(`   past mistakes: ${c.pastMistakes.length ? c.pastMistakes.join("; ") : "none"}`);
      return lines.join("\n");
    })
    .join("\n");
}

function formatTranscript(transcript: ChatTurn[]): string {
  return transcript
    .map((t) => `${t.role === "user" ? "TEACHER" : "AI STUDENT"}: ${t.content}`)
    .join("\n\n");
}

export async function POST(req: Request) {
  try {
    const { topic, materials, concepts, transcript } = await readBody(req, BodySchema);
    if (!transcript.some((t) => t.role === "user" && t.content.trim().length > 0)) {
      throw new FriendlyError(400, "Explain the topic first, then finish.");
    }
    if (concepts.length === 0) {
      throw new FriendlyError(400, "No key concepts were found — go back and analyze your materials first.");
    }
    const transcriptChars = transcript.reduce((n, t) => n + t.content.length, 0);
    checkSize(materials, topic.length + transcriptChars);

    const prompt = `${formatMaterials(materials)}

<topic>${topic.trim() || "(see materials)"}</topic>

<key_concepts>
${formatConcepts(concepts)}
</key_concepts>

<transcript>
${formatTranscript(transcript)}
</transcript>

Write the Mistake Map: one item per key concept, same names and order, plus the overall summary.`;

    const out = await callStructured(OutputSchema, SYSTEM, [{ role: "user", content: prompt }]);

    const byName = new Map<string, (typeof out.items)[number]>();
    for (const item of out.items) {
      const key = normalize(item.concept);
      if (!byName.has(key)) byName.set(key, item);
    }
    const items: ReportItem[] = concepts.map((c) => {
      const got = byName.get(normalize(c.name));
      if (!got) {
        return {
          concept: c.name,
          status: "red",
          yourQuote: "",
          materialSays: c.definition,
          rootCause: "Not mentioned in your explanation.",
          fix: `Review ${c.name} in your materials and explain it in your own words. Then connect it to the other concepts you covered.`,
          testedOnPriorExam: c.testedOnPriorExam,
          pastMistakes: c.pastMistakes,
        };
      }
      return {
        concept: c.name,
        status: got.status,
        yourQuote: got.yourQuote.trim(),
        materialSays: got.materialSays.trim(),
        rootCause: got.rootCause.trim(),
        fix: got.fix.trim(),
        testedOnPriorExam: c.testedOnPriorExam,
        pastMistakes: c.pastMistakes,
      };
    });

    const report: Report = { overall: out.overall.trim(), items };
    return NextResponse.json({ report });
  } catch (err) {
    return errorResponse(err);
  }
}
