"use client";

import { useState } from "react";
import type { Material } from "@/lib/types";
import UploadScreen from "@/components/UploadScreen";

export default function Page() {
  const [topic, setTopic] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [next, setNext] = useState(false);

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
        {next ? (
          <div className="card">
            <h2>Concepts coming next</h2>
            <button className="btn" onClick={() => setNext(false)}>Back</button>
          </div>
        ) : (
          <UploadScreen
            topic={topic}
            materials={materials}
            onTopicChange={setTopic}
            onMaterialsChange={setMaterials}
            onNext={() => setNext(true)}
          />
        )}
      </main>
    </>
  );
}
