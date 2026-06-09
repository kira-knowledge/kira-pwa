"use client";
import { useEffect, useRef, useState } from "react";

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
  const [items, setItems] = useState<Item[] | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [err, setErr] = useState("");
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

  // Drop the active filter if its theme no longer exists after a refresh.
  useEffect(() => {
    if (activeTheme && !themes.some((t) => t.name === activeTheme)) {
      setActiveTheme(null);
    }
  }, [themes, activeTheme]);

  function refresh() {
    lastThemeCount.current = -1; // force a theme re-fetch on manual refresh
    load();
  }

  const activeUrls = activeTheme
    ? themes.find((t) => t.name === activeTheme)?.source_urls ?? []
    : null;
  const visibleItems =
    activeUrls && items
      ? items.filter((it) => activeUrls.includes(it.source_url))
      : items;

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.brand}>KIRA</h1>
        <button className={styles.refresh} onClick={refresh}>
          Refresh
        </button>
      </header>

      <InstallPrompt />

      <ThemeBubbles
        themes={themes}
        activeTheme={activeTheme}
        onSelect={setActiveTheme}
      />

      {err && <p className={styles.error}>Couldn&rsquo;t reach KIRA: {err}</p>}
      {items === null && <p className={styles.muted}>Loading your library&hellip;</p>}
      {items?.length === 0 && (
        <div className={styles.empty}>
          <p>Your library is empty.</p>
          <p className={styles.muted}>Share an Instagram reel to KIRA to see it here.</p>
        </div>
      )}

      <section className={styles.grid}>
        {visibleItems?.map((it) => (
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
