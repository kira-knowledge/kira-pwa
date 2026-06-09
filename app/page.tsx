"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import InstallPrompt from "./InstallPrompt";
import ThemeBubbles, { Theme } from "./ThemeBubbles";

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
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [err, setErr] = useState("");
  const [ask, setAsk] = useState("");
  const lastThemeCount = useRef<number>(-1);

  async function loadThemes() {
    try {
      const r = await fetch("/api/themes", { cache: "no-store" });
      const data = await r.json();
      setThemes(Array.isArray(data?.themes) ? data.themes : []);
    } catch {
      setThemes([]);
    }
  }

  async function load() {
    try {
      const r = await fetch("/api/library", { cache: "no-store" });
      const data = await r.json();
      const list: Item[] = Array.isArray(data) ? data : [];
      setItems(list);
      setErr("");
      if (list.length !== lastThemeCount.current) {
        lastThemeCount.current = list.length;
        await loadThemes();
      }
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  function refresh() {
    lastThemeCount.current = -1;
    load();
  }

  function submitAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = ask.trim();
    if (!q) return;
    router.push(`/chat?q=${encodeURIComponent(q)}`);
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.brand}>KIRA</h1>
        <button className={styles.refresh} onClick={refresh}>
          Refresh
        </button>
      </header>

      <InstallPrompt />

      <form className={styles.askBar} onSubmit={submitAsk}>
        <input
          className={styles.askInput}
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="Ask your saves…"
        />
        <button className={styles.askSend} type="submit">Ask</button>
      </form>

      <ThemeBubbles themes={themes} />

      {err && <p className={styles.error}>Couldn&rsquo;t reach KIRA: {err}</p>}
      {items === null && <p className={styles.muted}>Loading your library&hellip;</p>}
      {items?.length === 0 && (
        <div className={styles.empty}>
          <p>Your library is empty.</p>
          <p className={styles.muted}>Share an Instagram reel to KIRA to see it here.</p>
        </div>
      )}

      <section className={styles.grid}>
        {items?.map((it) => (
          <article key={it.source_url} className={styles.card}>
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
