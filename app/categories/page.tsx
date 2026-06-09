"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../../components/BottomNav";
import styles from "../page.module.css";

type Theme = { name: string; why: string; count: number };

export default function CategoriesPage() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    fetch("/api/themes", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setThemes(Array.isArray(d?.themes) ? d.themes : []);
        setReady(d?.ready !== false);
      })
      .catch(() => setThemes([]));
  }, []);

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Categories</h1>
      </header>
      {themes === null && <p className={styles.muted}>Loading…</p>}
      {themes && themes.length === 0 && (
        <p className={styles.muted}>
          {ready
            ? "No categories yet."
            : "Save a few more reels and KIRA will group them into categories."}
        </p>
      )}
      <div className={styles.catList}>
        {themes?.map((t) => (
          <button
            key={t.name}
            className={styles.catItem}
            onClick={() => router.push(`/category/${encodeURIComponent(t.name)}`)}
          >
            <div>
              <div className={styles.catName}>{t.name}</div>
              <div className={styles.catWhy}>{t.why}</div>
            </div>
            <span className={styles.bubbleCount}>{t.count}</span>
          </button>
        ))}
      </div>
      <BottomNav active="categories" />
    </main>
  );
}
