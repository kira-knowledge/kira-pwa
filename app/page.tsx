"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./home.module.css";
import shared from "./shared.module.css";
import InstallPrompt from "./InstallPrompt";
import TopBar from "../components/TopBar";
import SearchBox from "../components/SearchBox";
import CategoryPills, { PillTheme } from "../components/CategoryPills";
import BottomNav from "../components/BottomNav";
import SaveCard from "../components/SaveCard";
import { useUser } from "../lib/useUser";
import { firstNameFrom } from "../lib/name";

type Item = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  thumbnail: string;
  source_url: string;
  thumb_key?: string;
  created_at: string;
};

const SUGGESTED_PROMPT = "Build me a 3-day Tokyo itinerary from my saved reels";

export default function Library() {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [themes, setThemes] = useState<PillTheme[]>([]);
  const [err, setErr] = useState("");
  const lastThemeCount = useRef<number>(-1);
  const { email, fullName } = useUser();
  const first = firstNameFrom(fullName, email);

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

  return (
    <main className={shared.wrap}>
      <TopBar />
      <p className={styles.greeting}>{first ? `Hi ${first}!` : "Hi there!"}</p>
      <SearchBox placeholder="What are we looking for today?" />
      <button
        className={styles.suggested}
        onClick={() => router.push(`/chat?q=${encodeURIComponent(SUGGESTED_PROMPT)}`)}
      >
        <span className={styles.suggestedLabel}>Suggested prompt</span>
        <span className={styles.suggestedText}>{SUGGESTED_PROMPT}</span>
      </button>

      <InstallPrompt />

      <h2 className={shared.sectionTitle}>Knowledge</h2>
      {themes.length === 0 ? (
        <p className={shared.muted}>Save a few more reels and KIRA will group them into categories.</p>
      ) : (
        <CategoryPills themes={themes} />
      )}

      <h2 className={shared.sectionTitle}>Recent saves</h2>
      {err && <p className={shared.error}>Couldn&rsquo;t reach KIRA: {err}</p>}
      {items === null && <p className={shared.muted}>Loading your library&hellip;</p>}
      {items?.length === 0 && (
        <div className={styles.empty}>
          <p>Your library is empty.</p>
          <p className={shared.muted}>Share an Instagram reel to KIRA to see it here.</p>
        </div>
      )}
      <div className={shared.cardList}>
        {items?.slice(0, 3).map((it) => (
          <SaveCard
            key={it.id}
            item={it}
            className={`${shared.card} ${styles.saveCard}`}
          />
        ))}
      </div>

      <BottomNav active="home" />
    </main>
  );
}
