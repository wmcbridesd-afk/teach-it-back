// Shared shapes used by both the browser and the server routes.

export const FILE_TAGS = ["Notes", "Slides", "Prior exam", "Graded assignment", "Other"] as const;
export type FileTag = (typeof FILE_TAGS)[number];

export interface Material {
  id: string;
  name: string;
  tag: FileTag;
  text: string;
}

export interface Concept {
  name: string;
  definition: string;
  prerequisites: string[];
  testedOnPriorExam: boolean;
  pastMistakes: string[];
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type Status = "green" | "yellow" | "red";

export interface ReportItem {
  concept: string;
  status: Status;
  yourQuote: string;
  materialSays: string;
  rootCause: string;
  fix: string;
  testedOnPriorExam: boolean;
  pastMistakes: string[];
}

export interface Report {
  overall: string;
  items: ReportItem[];
}

export const MAX_AI_TURNS = 6;

// Vercel rejects request bodies over 4.5 MB; stay well under it.
export const MAX_TOTAL_CHARS = 1_500_000;
