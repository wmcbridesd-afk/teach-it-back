"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { postJSON } from "@/lib/api";
import type { ChatTurn, Concept, Material, Report, Status } from "@/lib/types";
import styles from "./ReportScreen.module.css";

interface Props {
  topic: string;
  materials: Material[];
  concepts: Concept[];
  transcript: ChatTurn[];
  report: Report | null;
  previousReport: Report | null;
  focused: boolean;
  onTeachAgainFocused: () => void;
  onReport: (r: Report) => void;
  onTeachAgain: () => void;
  onStartOver: () => void;
}

const ORDER: Record<Status, number> = { red: 0, yellow: 1, green: 2 };
const LABEL: Record<Status, string> = {
  green: "Explained well",
  yellow: "Partial",
  red: "Missing or wrong",
};

const PROGRESS_MESSAGES = [
  "Comparing your explanation to the material…",
  "Checking past exams and graded work…",
  "Tracing root causes…",
  "Writing your fixes…",
];

const RANK: Record<Status, number> = { red: 0, yellow: 1, green: 2 };
const STATUS_WORD: Record<Status, string> = { green: "Green", yellow: "Yellow", red: "Red" };

export default function ReportScreen({
  topic,
  materials,
  concepts,
  transcript,
  report,
  previousReport,
  focused,
  onTeachAgainFocused,
  onReport,
  onTeachAgain,
  onStartOver,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const waiting = !report && !error;

  useEffect(() => {
    if (!waiting) return;
    setMsgIdx(0);
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % PROGRESS_MESSAGES.length), 3000);
    return () => clearInterval(id);
  }, [waiting]);

  const fetchReport = useCallback(async () => {
    setError(null);
    try {
      const res = await postJSON<{ report: Report }>("/api/report", {
        topic,
        materials,
        concepts,
        transcript,
      });
      onReport(res.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
    }
  }, [topic, materials, concepts, transcript, onReport]);

  useEffect(() => {
    if (report || started.current) return;
    started.current = true;
    void fetchReport();
  }, [report, fetchReport]);

  if (!report) {
    return (
      <div className="container stack">
        {error ? (
          <>
            <div className="error-box">{error}</div>
            <div>
              <button className="btn btn-primary" onClick={() => void fetchReport()}>
                Try again
              </button>
            </div>
          </>
        ) : (
          <div className="loading">
            <span className="spinner" />
            <span key={msgIdx} className={styles.progressMsg} role="status">
              {PROGRESS_MESSAGES[msgIdx]}
            </span>
          </div>
        )}
      </div>
    );
  }

  const items = [...report.items].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const count = (s: Status) => items.filter((i) => i.status === s).length;
  const prevByConcept = new Map<string, Status>();
  previousReport?.items.forEach((i) => prevByConcept.set(i.concept, i.status));
  const changeOf = (item: { concept: string; status: Status }) => {
    const before = prevByConcept.get(item.concept);
    if (!before) return null;
    const d = RANK[item.status] - RANK[before];
    return { before, kind: d > 0 ? "Improved" : d < 0 ? "Slipped" : "Same" } as const;
  };
  const improved = items.filter((i) => changeOf(i)?.kind === "Improved").length;
  const showTeachFocused = items.some((i) => i.status !== "green");

  return (
    <div className="container stack">
      <h1>
        Mistake Map: {topic}
        {focused && <span className={styles.focusedTag}>Focused round</span>}
      </h1>

      <div className={styles.summary}>
        <span className="status-pill green">{count("green")} explained well</span>
        <span className="status-pill yellow">{count("yellow")} partial</span>
        <span className="status-pill red">{count("red")} missing or wrong</span>
        {previousReport && improved > 0 && (
          <span className={`status-pill ${styles.improvedPill}`}>{improved} improved since last round</span>
        )}
      </div>

      <div className="card">
        <p style={{ margin: 0 }}>{report.overall}</p>
      </div>

      <p className={`muted small ${styles.legend}`}>
        Mistakes you made on past graded work count toward yellow or red, even if your
        explanation today was close.
      </p>

      {items.map((item, idx) => (
        <div key={`${item.concept}-${idx}`} className={`card ${styles.item} ${styles[item.status]}`}>
          <div className={styles.header}>
            <h2 className={styles.name}>{item.concept}</h2>
            {item.testedOnPriorExam && <span className="badge badge-exam">Tested on prior exam</span>}
            <span className={`status-pill ${item.status}`}>{LABEL[item.status]}</span>
          </div>

          {(() => {
            const ch = changeOf(item);
            if (!ch) return null;
            return (
              <div className={styles.change} aria-label={`Last round ${ch.before}, now ${item.status}: ${ch.kind}`}>
                <span className="muted small">Last round</span>
                <span className={`status-pill ${ch.before}`}>{STATUS_WORD[ch.before]}</span>
                <span aria-hidden="true">→</span>
                <span className={`status-pill ${item.status}`}>{STATUS_WORD[item.status]}</span>
                <strong className={`${styles.changeWord} ${styles[`c${ch.kind}`]}`}>{ch.kind}</strong>
              </div>
            );
          })()}

          <div className={styles.compare}>
            <div className={styles.col}>
              <h3 className={styles.colTitle}>You said</h3>
              {item.yourQuote.trim() ? (
                <blockquote className={styles.quote}>{item.yourQuote}</blockquote>
              ) : (
                <p className={styles.empty}>You didn&apos;t mention this.</p>
              )}
            </div>
            <div className={styles.col}>
              <h3 className={styles.colTitle}>The material says</h3>
              <p className={styles.text}>{item.materialSays}</p>
            </div>
          </div>

          <div className={styles.block}>
            <h3 className={styles.colTitle}>Likely root cause</h3>
            <p className={styles.text}>{item.rootCause}</p>
          </div>
          <div className={styles.block}>
            <h3 className={styles.colTitle}>Fix</h3>
            <p className={styles.text}>{item.fix}</p>
          </div>

          {item.pastMistakes.length > 0 && (
            <div className={styles.block}>
              <h3 className={styles.colTitle}>Past mistakes on graded work</h3>
              <ul className={`small ${styles.past}`}>
                {item.pastMistakes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      <div className={styles.actions}>
        {showTeachFocused && (
          <div className={styles.focusAction}>
            <button className="btn btn-primary" onClick={onTeachAgainFocused}>
              Teach it again: red concepts only
            </button>
            <span className="muted small">Covers red and yellow concepts.</span>
          </div>
        )}
        <button className={`btn ${showTeachFocused ? "btn-secondary" : "btn-primary"}`} onClick={onTeachAgain}>
          Teach it again
        </button>
        <button className="btn btn-secondary" onClick={onStartOver}>
          Start over with new material
        </button>
      </div>
    </div>
  );
}
