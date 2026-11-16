"use client";

import { useState } from "react";
import type { Concept, Material } from "@/lib/types";
import UploadScreen from "@/components/UploadScreen";
import ConceptsScreen from "@/components/ConceptsScreen";

type Step = "upload" | "concepts" | "teach";

export default function Page() {
  const [step, setStep] = useState<Step>("upload");
  const [topic, setTopic] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [concepts, setConcepts] = useState<Concept[] | null>(null);

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
              setMaterials(m);
            }}
            onNext={() => setStep("concepts")}
          />
        ) : step === "concepts" ? (
          <ConceptsScreen
            topic={topic}
            materials={materials}
            concepts={concepts}
            onConcepts={setConcepts}
            onBack={() => setStep("upload")}
            onNext={() => setStep("teach")}
          />
        ) : (
          <div className="card">
            <h2>Teaching chat coming next</h2>
            <button className="btn" onClick={() => setStep("concepts")}>Back</button>
          </div>
        )}
      </main>
    </>
  );
}
