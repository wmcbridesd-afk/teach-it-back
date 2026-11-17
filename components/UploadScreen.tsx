"use client";

import { useEffect, useRef, useState } from "react";
import { FILE_TAGS, MAX_TOTAL_CHARS, type FileTag, type Material } from "@/lib/types";
import { extractText } from "@/lib/extract";
import { SAMPLE_TOPIC, SAMPLE_MATERIALS } from "@/lib/sample";
import styles from "./UploadScreen.module.css";

const DRAFT_KEY = "teach-it-back-paste-draft";

const STEPS = ["Upload your material", "Teach it to an AI student", "See your Mistake Map"];

interface Props {
  topic: string;
  materials: Material[];
  onTopicChange(t: string): void;
  onMaterialsChange(m: Material[]): void;
  onNext(): void;
}

function guessTag(name: string): FileTag {
  const n = name.toLowerCase();
  if (/exam|midterm|final|quiz/.test(n)) return "Prior exam";
  if (/slide|deck|ppt/.test(n)) return "Slides";
  if (/assign|hw|homework|graded|problem.?set|pset/.test(n)) return "Graded assignment";
  if (/note|lecture/.test(n)) return "Notes";
  return "Other";
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function UploadScreen({ topic, materials, onTopicChange, onMaterialsChange, onNext }: Props) {
  const [extracting, setExtracting] = useState<string[]>([]);
  const [notes, setNotes] = useState<{ kind: "warn" | "error"; text: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pasted, setPasted] = useState("");
  const [pastedTag, setPastedTag] = useState<FileTag>("Notes");
  const [pasteCount, setPasteCount] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const draftLoaded = useRef(false);

  // Restore the paste draft (text + tag) so Back never loses it.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { text?: unknown; tag?: unknown };
        if (typeof d.text === "string") setPasted(d.text);
        if (typeof d.tag === "string" && (FILE_TAGS as readonly string[]).includes(d.tag)) {
          setPastedTag(d.tag as FileTag);
        }
      }
    } catch {}
    draftLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!draftLoaded.current) return;
    try {
      if (pasted) sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ text: pasted, tag: pastedTag }));
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [pasted, pastedTag]);
  // Latest materials, so concurrent async additions don't clobber each other.
  const latest = useRef<Material[]>(materials);
  latest.current = materials;

  function commit(next: Material[]) {
    latest.current = next;
    onMaterialsChange(next);
  }

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    const newNotes: { kind: "warn" | "error"; text: string }[] = [];
    const ok: File[] = [];
    for (const f of files) {
      if (/\.(pdf|txt|md)$/i.test(f.name)) ok.push(f);
      else newNotes.push({ kind: "error", text: `${f.name} isn't supported. Please use .pdf, .txt or .md files.` });
    }
    setNotes(newNotes);
    for (const f of ok) {
      const key = `${f.name}-${newId()}`;
      setExtracting((e) => [...e, key]);
      try {
        const text = await extractText(f);
        if (!text.trim()) {
          setNotes((n) => [
            ...n,
            { kind: "warn", text: `No readable text found in ${f.name} (maybe a scanned PDF) — skipped.` },
          ]);
        } else {
          commit([...latest.current, { id: newId(), name: f.name, tag: guessTag(f.name), text }]);
        }
      } catch (e) {
        setNotes((n) => [
          ...n,
          { kind: "error", text: e instanceof Error ? e.message : `Couldn't read ${f.name}.` },
        ]);
      } finally {
        setExtracting((x) => x.filter((k) => k !== key));
      }
    }
  }

  function addPasted() {
    const text = pasted.trim();
    if (!text) return;
    commit([...latest.current, { id: newId(), name: `Pasted text ${pasteCount}`, tag: pastedTag, text }]);
    setPasteCount(pasteCount + 1);
    setPasted("");
  }

  function loadSample() {
    setNotes([]);
    onTopicChange(SAMPLE_TOPIC);
    commit(SAMPLE_MATERIALS.map((m) => ({ ...m })));
  }

  function setTag(id: string, tag: FileTag) {
    commit(latest.current.map((m) => (m.id === id ? { ...m, tag } : m)));
  }

  function remove(id: string) {
    commit(latest.current.filter((m) => m.id !== id));
  }

  const total = materials.reduce((s, m) => s + m.text.length, 0);
  const tooBig = total > MAX_TOTAL_CHARS;
  const canContinue =
    topic.trim().length > 0 && materials.some((m) => m.text.trim().length > 0) && !tooBig && extracting.length === 0;

  return (
    <div className="stack">
      <ol className={styles.steps} aria-label="How it works">
        {STEPS.map((label, i) => (
          <li key={label} className={`${styles.step}${i === 0 ? ` ${styles.active}` : ""}`}>
            <span className={styles.num}>{i + 1}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      <div className="card stack">
        <div>
          <h1 className="section-title">Upload your course material</h1>
          <p className="muted">
            Add notes, slides, prior exams, or graded assignments. You will teach the concepts to an AI student, and
            it will map where your understanding breaks down.
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary btn-big" onClick={loadSample}>
            Try a sample lesson
          </button>
          <span className="muted small">No files handy? Load an example topic and materials.</span>
        </div>
      </div>

      <div className="card stack">
        <div>
          <label className="label" htmlFor="topic">Topic name</label>
          <input
            id="topic"
            className="input"
            type="text"
            placeholder="e.g. Photosynthesis, Linear Algebra Midterm"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
          />
        </div>

        <div
          className={`dropzone${dragging ? " drag" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
          }}
        >
          <strong>Drop files here or click to browse</strong>
          <div className="small">PDF, TXT, or MD</div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md"
            hidden
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {notes.map((n, i) => (
          <div key={i} className={n.kind === "warn" ? "warn-box" : "error-box"}>
            {n.text}
          </div>
        ))}

        {(materials.length > 0 || extracting.length > 0) && (
          <div>
            {materials.map((m) => (
              <div className="file-item" key={m.id}>
                <span className="name">{m.name}</span>
                <span className="row">
                  <span className="muted small">{m.text.length.toLocaleString()} chars</span>
                  <select
                    className="select"
                    aria-label={`Tag for ${m.name}`}
                    value={m.tag}
                    onChange={(e) => setTag(m.id, e.target.value as FileTag)}
                  >
                    {FILE_TAGS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary" onClick={() => remove(m.id)}>
                    Remove
                  </button>
                </span>
              </div>
            ))}
            {extracting.map((k) => (
              <div className="file-item" key={k}>
                <span className="loading">
                  <span className="spinner" /> Extracting…
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card stack">
        <div>
          <label className="label" htmlFor="paste">Or paste text</label>
          <textarea
            id="paste"
            className="textarea"
            placeholder="Paste notes or exam questions here"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
        </div>
        <div className="row">
          <select
            className="select"
            aria-label="Tag for pasted text"
            value={pastedTag}
            onChange={(e) => setPastedTag(e.target.value as FileTag)}
          >
            {FILE_TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary" onClick={addPasted} disabled={!pasted.trim()}>
            Add pasted text
          </button>
        </div>
      </div>

      <div className="card stack">
        <div className="muted small">Total: {total.toLocaleString()} characters</div>
        {tooBig && (
          <div className="error-box">
            Your materials total {total.toLocaleString()} characters, over the {MAX_TOTAL_CHARS.toLocaleString()}{" "}
            limit. Remove some files or trim the pasted text to continue.
          </div>
        )}
        <div className="row">
          <button type="button" className="btn btn-primary btn-big" onClick={onNext} disabled={!canContinue}>
            Find key concepts →
          </button>
          {!canContinue && !tooBig && (
            <span className="muted small">Add a topic name and at least one material to continue.</span>
          )}
        </div>
      </div>
    </div>
  );
}
