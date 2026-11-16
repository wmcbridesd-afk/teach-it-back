"use client";

import { useState } from "react";
import type { ChatTurn, Concept, Material } from "@/lib/types";
import UploadScreen from "@/components/UploadScreen";
import ConceptsScreen from "@/components/ConceptsScreen";
import TeachScreen from "@/components/TeachScreen";

type Step = "upload" | "concepts" | "teach" | "report";

export default function Page() {
  const [step, setStep] = useState<Step>("upload");
  const [topic, setTopic] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [transcript, setTranscript] = useState<ChatTurn[]>([]);

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="brand">
            <strong>Teach It Back</strong>
            <span className="muted">: learn it by teaching it</span>
          </div>
        </div>
      </header>
      <main className="container">
        {step === "upload" ? (
          <UploadScreen
            topic={topic}
            materials={materials}
            onTopicChange={setTopic}
            onMaterialsChange={(m) => {
              setConcepts(null);
              setTranscript([]);
              setMaterials(m);
            }}
            onNext={() => setStep("concepts")}
          />
        ) : step === "concepts" ? (
          <ConceptsScreen
            topic={topic}
            materials={materials}
            concepts={concepts}
            onConcepts={(c) => {
              setConcepts(c);
              setTranscript([]);
            }}
            onBack={() => setStep("upload")}
            onNext={() => setStep("teach")}
          />
        ) : step === "teach" && concepts ? (
          <TeachScreen
            topic={topic}
            materials={materials}
            concepts={concepts}
            transcript={transcript}
            onTranscript={setTranscript}
            onBack={() => setStep("concepts")}
            onFinish={() => setStep("report")}
          />
        ) : (
          <div className="card">
            <h2>Mistake Map coming next</h2>
            <button className="btn" onClick={() => setStep("teach")}>Back</button>
          </div>
        )}
      </main>
    </>
  );
}
