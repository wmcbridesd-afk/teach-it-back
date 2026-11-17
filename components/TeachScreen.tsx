"use client";

import { useEffect, useRef, useState } from "react";
import { postJSON } from "@/lib/api";
import { MAX_AI_TURNS } from "@/lib/types";
import type { ChatTurn, Concept, Material } from "@/lib/types";
import styles from "./TeachScreen.module.css";

interface Props {
  topic: string;
  materials: Material[];
  concepts: Concept[];
  focused: boolean;
  transcript: ChatTurn[];
  onTranscript: (t: ChatTurn[]) => void;
  onBack: () => void;
  onFinish: () => void;
}

export default function TeachScreen({
  topic,
  materials,
  concepts,
  focused,
  transcript,
  onTranscript,
  onBack,
  onFinish,
}: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const aiTurns = transcript.filter((t) => t.role === "assistant").length;
  const userTurns = transcript.filter((t) => t.role === "user").length;
  const done = aiTurns >= MAX_AI_TURNS;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript.length, loading, done]);

  async function send() {
    const content = input.trim();
    if (!content || loading || done) return;
    const prev = transcript;
    const next: ChatTurn[] = [...prev, { role: "user", content }];
    onTranscript(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await postJSON<{ reply: string }>("/api/student", {
        topic,
        materials,
        concepts,
        transcript: next,
      });
      onTranscript([...next, { role: "assistant", content: res.reply }]);
    } catch (err) {
      onTranscript(prev);
      setInput(content);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="stack">
        <div className="card">
          <p style={{ margin: 0 }}>
            Explain <strong>{topic}</strong> as if to a classmate who missed the lecture. Your
            &lsquo;student&rsquo; will ask follow-up questions about anything you skip or get
            wrong.
          </p>
        </div>

        {focused && (
          <div className={styles.focusBanner}>
            <strong>Focused round: just the concepts you missed last time</strong>
            <div className={styles.chips}>
              {concepts.map((c, i) => (
                <span className="chip" key={`${c.name}-${i}`}>
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <details className={`card ${styles.concepts}`}>
          <summary>Concepts to cover ({concepts.length})</summary>
          <div className={styles.chips}>
            {concepts.length === 0 ? (
              <span className="muted small">No concepts listed.</span>
            ) : (
              concepts.map((c, i) => (
                <span className="chip" key={`${c.name}-${i}`}>
                  {c.name}
                </span>
              ))
            )}
          </div>
        </details>

        <div className={styles.chat}>
          {transcript.map((t, i) => (
            <div
              key={i}
              className={`${styles.msg} ${t.role === "user" ? styles.msgUser : styles.msgAi}`}
            >
              {t.role === "assistant" && <span className={styles.label}>Student</span>}
              <div
                className={`${styles.bubble} ${
                  t.role === "user" ? styles.bubbleUser : styles.bubbleAi
                }`}
              >
                {t.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.msg} ${styles.msgAi}`}>
              <span className={styles.label}>Student</span>
              <div className={`${styles.bubble} ${styles.bubbleAi} ${styles.thinking}`}>
                <span className="spinner" />
                <span>Student is thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && <div className="error-box">{error}</div>}

        {done ? (
          <div className={`card stack ${styles.done}`}>
            <strong>That&rsquo;s all the student&rsquo;s questions.</strong>
            <button className="btn btn-primary btn-big" onClick={onFinish}>
              Finish → see my Mistake Map
            </button>
          </div>
        ) : (
          <div className="stack">
            <textarea
              className="textarea"
              rows={4}
              value={input}
              disabled={loading}
              placeholder={
                userTurns === 0
                  ? "Start explaining in your own words…"
                  : "Answer the student's question…"
              }
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <p className="muted small" style={{ margin: 0 }}>
              Explain it like you would to a friend. Tip: get one thing wrong on purpose to see the Mistake Map catch it.
            </p>
            <div className="row">
              <button
                className="btn btn-primary"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
              >
                Send
              </button>
              <span className="muted small">Cmd/Ctrl+Enter to send</span>
              <span className={`muted small ${styles.counter}`}>
                Student questions: {aiTurns} / {MAX_AI_TURNS}
              </span>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back to concepts
          </button>
          {done && (
            <span className="muted small">
              Student questions: {aiTurns} / {MAX_AI_TURNS}
            </span>
          )}
          {userTurns >= 1 && !loading && !done && (
            <button className="btn btn-secondary" onClick={onFinish}>
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
