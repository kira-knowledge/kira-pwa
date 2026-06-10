"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../../../components/BottomNav";
import {
  EditState, setSummary, setInsight, addInsight, removeInsight,
  addTag, removeTag, toPatch,
} from "../../../lib/postEdit";
import { primaryCategory } from "../../../lib/primaryCategory";
import styles from "./post.module.css";

type Item = {
  id: string;
  title: string;
  author: string;
  source_url: string;
  summary: string;
  key_insights: string[];
  tags: string[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function PostViewer({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = decodeURIComponent(params.id);
  const [item, setItem] = useState<Item | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [notFound, setNotFound] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [lr, tr] = await Promise.all([
          fetch("/api/library", { cache: "no-store" }),
          fetch("/api/themes", { cache: "no-store" }),
        ]);
        const all: Item[] = await lr.json();
        const found = Array.isArray(all) ? all.find((x) => x.id === id) : undefined;
        if (!found) {
          setNotFound(true);
          return;
        }
        setItem(found);
        setEdit({
          summary: found.summary ?? "",
          key_insights: found.key_insights ?? [],
          tags: found.tags ?? [],
        });
        try {
          const td = await tr.json();
          setCategory(primaryCategory(td?.themes ?? [], found.source_url));
        } catch {
          setCategory(null);
        }
      } catch {
        setNotFound(true);
      }
    })();
  }, [id]);

  async function save() {
    if (!edit) return;
    setStatus("saving");
    try {
      const r = await fetch(`/api/items/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPatch(edit)),
      });
      setStatus(r.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (notFound) {
    return (
      <main className={styles.wrap}>
        <p className={styles.muted}>That post isn't in your library.</p>
        <button className={styles.linkBtn} onClick={() => router.push("/")}>
          ← Home
        </button>
        <BottomNav />
      </main>
    );
  }
  if (!item || !edit) {
    return (
      <main className={styles.wrap}>
        <p className={styles.muted}>Loading…</p>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.linkBtn} onClick={() => router.back()}>
          ←
        </button>
        <a className={styles.source} href={item.source_url} target="_blank" rel="noreferrer">
          Source ↗
        </a>
      </header>
      {category && (
        <button
          className={styles.categoryChip}
          onClick={() => router.push(`/category/${encodeURIComponent(category)}`)}
        >
          {category}
        </button>
      )}
      <h1 className={styles.title}>{item.title}</h1>

      <label className={styles.label}>Summary</label>
      <textarea
        className={styles.textarea}
        value={edit.summary}
        onChange={(e) => setEdit(setSummary(edit, e.target.value))}
      />

      <label className={styles.label}>Key insights</label>
      {edit.key_insights.map((ins, i) => (
        <div key={i} className={styles.row}>
          <input
            className={styles.input}
            value={ins}
            onChange={(e) => setEdit(setInsight(edit, i, e.target.value))}
          />
          <button className={styles.remove} onClick={() => setEdit(removeInsight(edit, i))}>
            ✕
          </button>
        </div>
      ))}
      <button className={styles.add} onClick={() => setEdit(addInsight(edit))}>
        + Add insight
      </button>

      <label className={styles.label}>Tags</label>
      <div className={styles.tagRow}>
        {edit.tags.map((t) => (
          <span key={t} className={styles.tag} onClick={() => setEdit(removeTag(edit, t))}>
            #{t} ✕
          </span>
        ))}
      </div>
      <input
        className={styles.input}
        value={tagDraft}
        placeholder="add a tag, press Enter"
        onChange={(e) => setTagDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEdit(addTag(edit, tagDraft));
            setTagDraft("");
          }
        }}
      />

      <div className={styles.saveRow}>
        <button className={styles.save} onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && <span className={styles.ok}>Saved ✓</span>}
        {status === "error" && (
          <span className={styles.err}>Couldn't save — your edits are kept, try again.</span>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
