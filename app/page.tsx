"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatTurn, Concept, Material, Report } from "@/lib/types";
import UploadScreen from "@/components/UploadScreen";
import ConceptsScreen from "@/components/ConceptsScreen";
import TeachScreen from "@/components/TeachScreen";
import ReportScreen from "@/components/ReportScreen";

type Step = "upload" | "concepts" | "teach" | "report";

const STORAGE_KEY = "teach-it-back-state";
const DRAFT_KEY = "teach-it-back-paste-draft";
const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "concepts", label: "Concepts" },
  { id: "teach", label: "Teach" },
  { id: "report", label: "Mistake Map" },
];

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [topic, setTopic] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [transcript, setTranscript] = useState<ChatTurn[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [focusConcepts, setFocusConcepts] = useState<string[] | null>(null);
  const [previousReport, setPreviousReport] = useState<Report | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirmOpen) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === "object") {
          if (["upload", "concepts", "teach", "report"].includes(s.step)) setStep(s.step);
          if (typeof s.topic === "string") setTopic(s.topic);
          if (Array.isArray(s.materials)) setMaterials(s.materials);
          if (Array.isArray(s.concepts)) setConcepts(s.concepts);
          if (Array.isArray(s.transcript)) setTranscript(s.transcript);
          if (s.report && typeof s.report === "object") setReport(s.report);
          if (typeof s.draft === "string") setDraft(s.draft);
          if (Array.isArray(s.focusConcepts)) setFocusConcepts(s.focusConcepts);
          if (s.previousReport && typeof s.previousReport === "object") setPreviousReport(s.previousReport);
        }
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step, topic, materials, concepts, transcript, report, focusConcepts, previousReport, draft }),
      );
    } catch {
      /* storage full or unavailable */
    }
  }, [loaded, step, topic, materials, concepts, transcript, report, focusConcepts, previousReport, draft]);

  function resetDownstream() {
    setConcepts(null);
    setTranscript([]);
    setReport(null);
    setFocusConcepts(null);
    setPreviousReport(null);
    setDraft("");
  }

  function changeTopic(t: string) {
    if (t !== topic) resetDownstream();
    setTopic(t);
  }

  function changeMaterials(m: Material[]) {
    resetDownstream();
    setMaterials(m);
  }

  function changeTranscript(t: ChatTurn[]) {
    setReport(null);
    setTranscript(t);
  }

  function startOver() {
    setTopic("");
    setMaterials([]);
    resetDownstream();
    setStep("upload");
  }

  function newSession() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    startOver();
    setConfirmOpen(false);
    setSessionKey((k) => k + 1);
  }

  function teachAgain() {
    setPreviousReport(report);
    setFocusConcepts(null);
    setDraft("");
    setTranscript([]);
    setReport(null);
    setStep("teach");
  }

  function teachAgainFocused() {
    if (!report) return;
    const names = report.items.filter((i) => i.status !== "green").map((i) => i.concept);
    setPreviousReport(report);
    setFocusConcepts(names);
    setDraft("");
    setTranscript([]);
    setReport(null);
    setStep("teach");
  }

  const activeConcepts = useMemo(() => {
    if (!concepts) return null;
    if (!focusConcepts) return concepts;
    const f = concepts.filter((c) => focusConcepts.includes(c.name));
    return f.length > 0 ? f : concepts;
  }, [concepts, focusConcepts]);
  const focused = !!focusConcepts && !!concepts && activeConcepts !== concepts;

  const effectiveStep: Step = (step === "teach" || step === "report") && !concepts ? "concepts" : step;
  const hasWork =
    step !== "upload" || topic.trim() !== "" || materials.length > 0 || !!concepts || transcript.length > 0 || !!report;
  const currentIdx = STEPS.findIndex((s) => s.id === effectiveStep);

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="brand">
            <strong>Teach It Back</strong>
            <span className="muted">: learn it by teaching it</span>
          </div>
          <nav className="steps" aria-label="Progress">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`step ${i === currentIdx ? "active" : i < currentIdx ? "done" : "future"}`}
                aria-current={i === currentIdx ? "step" : undefined}
              >
                {i < currentIdx && <span aria-hidden="true">✓ </span>}
                {s.label}
              </span>
            ))}
          </nav>
          {loaded && hasWork && (
            <div className="header-actions">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                aria-expanded={confirmOpen}
                aria-haspopup="dialog"
                onClick={() => setConfirmOpen((o) => !o)}
              >
                New session
              </button>
              {confirmOpen && (
                <div className="confirm-popover" role="dialog" aria-label="Confirm new session">
                  <p>Start over? Your current Mistake Map will be cleared.</p>
                  <div className="confirm-actions">
                    <button type="button" className="btn btn-primary btn-small" onClick={newSession}>
                      Start over
                    </button>
                    <button
                      type="button"
                      ref={cancelRef}
                      className="btn btn-secondary btn-small"
                      onClick={() => setConfirmOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="container" key={sessionKey}>
        {!loaded ? null : effectiveStep === "upload" ? (
          <UploadScreen
            topic={topic}
            materials={materials}
            onTopicChange={changeTopic}
            onMaterialsChange={changeMaterials}
            onNext={() => setStep("concepts")}
          />
        ) : effectiveStep === "concepts" ? (
          <ConceptsScreen
            topic={topic}
            materials={materials}
            concepts={concepts}
            onConcepts={(c) => {
              setConcepts(c);
              setTranscript([]);
              setReport(null);
              setFocusConcepts(null);
              setPreviousReport(null);
              setDraft("");
            }}
            onBack={() => setStep("upload")}
            onNext={() => setStep("teach")}
          />
        ) : effectiveStep === "teach" && concepts && activeConcepts ? (
          <TeachScreen
            topic={topic}
            materials={materials}
            concepts={activeConcepts}
            focused={focused}
            transcript={transcript}
            draft={draft}
            onDraftChange={setDraft}
            onTranscript={changeTranscript}
            onBack={() => setStep("concepts")}
            onFinish={() => setStep("report")}
          />
        ) : concepts && activeConcepts ? (
          <ReportScreen
            topic={topic}
            materials={materials}
            concepts={activeConcepts}
            previousReport={previousReport}
            focused={focused}
            onTeachAgainFocused={teachAgainFocused}
            transcript={transcript}
            report={report}
            onReport={setReport}
            onTeachAgain={teachAgain}
            onStartOver={startOver}
          />
        ) : null}
      </main>
    </>
  );
}
