"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import InstallPrompt from "./InstallPrompt";
import ThemeBubbles, { Theme } from "./ThemeBubbles";
import PostCard from "../components/PostCard";
import BottomNav from "../components/BottomNav";

type Item = {
  id: string;
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
          <PostCard key={it.id} item={it} />
        ))}
      </section>

      <BottomNav active="home" />
    </main>
  );
}
