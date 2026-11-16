"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { postJSON } from "@/lib/api";
import type { Concept, Material } from "@/lib/types";
import styles from "./ConceptsScreen.module.css";

interface Props {
  topic: string;
  materials: Material[];
  concepts: Concept[] | null;
  onConcepts: (c: Concept[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ConceptsScreen({
  topic,
  materials,
  concepts,
  onConcepts,
  onBack,
  onNext,
}: Props) {
  const [loading, setLoading] = useState(concepts === null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await postJSON<{ concepts: Concept[] }>("/api/concepts", {
        topic,
        materials,
      });
      if (id !== requestId.current) return;
      onConcepts(Array.isArray(res.concepts) ? res.concepts : []);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [topic, materials, onConcepts]);

  useEffect(() => {
    if (concepts === null && !startedRef.current) {
      startedRef.current = true;
      void load();
    }
  }, [concepts, load]);

  const list = concepts ?? [];

  return (
    <div className="container">
      <div className="stack">
        <div>
          <h2 className="section-title">Key concepts in {topic}</h2>
          {!loading && concepts && (
            <p className="muted small">
              {list.length} concept{list.length === 1 ? "" : "s"} found
            </p>
          )}
        </div>

        {loading && (
          <div className="card loading">
            <span className="spinner" />
            <span>Reading your materials and finding the key concepts…</span>
          </div>
        )}

        {error && !loading && (
          <div className="error-box stack">
            <div>{error}</div>
            <div>
              <button className="btn btn-secondary" onClick={() => void load()}>
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && concepts && list.length === 0 && !error && (
          <div className="warn-box">
            No concepts were found. Try regenerating, or go back and add more material.
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className="grid">
            {list.map((c, i) => (
              <div className="card stack" key={`${c.name}-${i}`}>
                <div className={styles.head}>
                  <h3 className={styles.name}>{c.name}</h3>
                  {c.testedOnPriorExam && (
                    <span className="badge badge-exam">Tested on prior exam</span>
                  )}
                </div>
                <p className={styles.def}>{c.definition}</p>
                {c.prerequisites?.length > 0 && (
                  <div className={styles.prereqs}>
                    <span className="muted small">Builds on:</span>
                    {c.prerequisites.map((p) => (
                      <span className="chip" key={p}>
                        {p}
                      </span>
                    ))}
                  </div>
                )}
                {c.pastMistakes?.length > 0 && (
                  <div className={styles.mistakes}>
                    <div className={styles.mistakesTitle}>Past mistakes</div>
                    <ul>
                      {c.pastMistakes.map((m, j) => (
                        <li key={j}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="row">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            Regenerate
          </button>
          <button
            className="btn btn-primary"
            onClick={onNext}
            disabled={loading || list.length === 0}
          >
            Start teaching →
          </button>
        </div>
      </div>
    </div>
  );
}
