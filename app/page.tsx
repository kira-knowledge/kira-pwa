"use client";
import { useEffect, useState } from "react";

import styles from "./page.module.css";

type Item = {
  title: string;
  summary: string;
  tags: string[];
  author: string;
  thumbnail: string;
  source_url: string;
  created_at: string;
};

export default function Library() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/library", { cache: "no-store" });
      const data = await r.json();
      setItems(Array.isArray(data) ? data : []);
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.brand}>KIRA</h1>
        <button className={styles.refresh} onClick={load}>
          Refresh
        </button>
      </header>

      {err && <p className={styles.error}>Couldn&rsquo;t reach KIRA: {err}</p>}
      {items === null && <p className={styles.muted}>Loading your library&hellip;</p>}
      {items?.length === 0 && (
        <div className={styles.empty}>
          <p>Your library is empty.</p>
          <p className={styles.muted}>Share an Instagram reel to KIRA to see it here.</p>
        </div>
      )}

      <section className={styles.grid}>
        {items?.map((it, i) => (
          <article key={i} className={styles.card}>
            {it.thumbnail ? (
              <img
                className={styles.thumb}
                src={it.thumbnail}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className={styles.thumbFallback} />
            )}
            <div className={styles.body}>
              <h2 className={styles.title}>{it.title}</h2>
              <p className={styles.summary}>{it.summary}</p>
              <div className={styles.tags}>
                {it.tags?.map((t, j) => (
                  <span key={j} className={styles.tag}>
                    #{t}
                  </span>
                ))}
              </div>
              <div className={styles.meta}>
                <span>@{it.author}</span>
                <a href={it.source_url} target="_blank" rel="noreferrer">
                  source ↗
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
