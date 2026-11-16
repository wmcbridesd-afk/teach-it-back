import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { MaterialSchema, callStructured, checkSize, errorResponse, formatMaterials, hasText, readBody, FriendlyError } from "@/lib/claude";
import type { Concept } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  topic: z.string(),
  materials: z.array(MaterialSchema),
});

const OutputSchema = z.object({
  concepts: z.array(
    z.object({
      name: z.string(),
      definition: z.string(),
      prerequisites: z.array(z.string()),
      testedOnPriorExam: z.boolean(),
      pastMistakes: z.array(z.string()),
    }),
  ),
});

const SYSTEM = `You are an expert tutor who analyzes a student's course materials to find the key concepts they must understand for a topic.

Each material is tagged with a type: "Notes", "Slides", "Prior exam", "Graded assignment", or "Other".

Extract 5 to 8 key concepts for the student's topic, grounded in the materials. For each concept give:
- name: a short, specific name (a few words).
- definition: ONE line, grounded in what the materials say.
- prerequisites: names of OTHER concepts in this same list that should be understood first. Use the exact names from your list. Only include concepts from this list; [] if none.
- testedOnPriorExam: true ONLY if a material of type "Prior exam" actually tests this concept; otherwise false.
- pastMistakes: concrete mistakes the student made on this concept, taken ONLY from materials of type "Graded assignment" (look for deductions, grader comments, wrong answers). Keep each brief and specific, citing the assignment and points lost if shown, e.g. "Used simple % change instead of the midpoint method (PS3, −3)". [] if none.

Order the list with foundational concepts first, so prerequisites come before the concepts that depend on them. Do not invent exam questions or mistakes that aren't in the materials.`;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function cleanup(raw: Concept[]): Concept[] {
  const seen = new Set<string>();
  const concepts: Concept[] = [];
  for (const c of raw) {
    const name = c.name.trim();
    const key = normalize(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    concepts.push({
      name,
      definition: c.definition.trim(),
      prerequisites: c.prerequisites,
      testedOnPriorExam: Boolean(c.testedOnPriorExam),
      pastMistakes: [...new Set(c.pastMistakes.map((m) => m.trim()).filter(Boolean))],
    });
  }
  const byKey = new Map(concepts.map((c) => [normalize(c.name), c.name]));
  for (const c of concepts) {
    const own = normalize(c.name);
    const prereqs: string[] = [];
    for (const p of c.prerequisites) {
      const canonical = byKey.get(normalize(p));
      if (canonical && normalize(canonical) !== own && !prereqs.includes(canonical)) prereqs.push(canonical);
    }
    c.prerequisites = prereqs;
  }
  return concepts;
}

export async function POST(req: Request) {
  try {
    const { topic, materials } = await readBody(req, BodySchema);
    if (!hasText(materials)) throw new FriendlyError(400, "Add some material first.");
    checkSize(materials, topic.length);

    const prompt = `${formatMaterials(materials)}

<topic>${topic.trim() || "(not specified — infer the main topic from the materials)"}</topic>

Extract the 5–8 key concepts for this topic from the materials above.`;

    const out = await callStructured(OutputSchema, SYSTEM, [{ role: "user", content: prompt }]);
    const concepts = cleanup(out.concepts);
    if (concepts.length === 0) {
      throw new FriendlyError(502, "Claude couldn't find any concepts in your materials. Try adding more detailed notes.");
    }
    return NextResponse.json({ concepts });
  } catch (err) {
    return errorResponse(err);
  }
}
