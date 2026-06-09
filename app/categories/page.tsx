"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./categories.module.css";
import shared from "../shared.module.css";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";

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
    <main className={shared.wrap}>
      <TopBar />
      <h2 className={shared.sectionTitle}>Categories</h2>
      {themes === null && <p className={shared.muted}>Loading&hellip;</p>}
      {themes && themes.length === 0 && (
        <p className={shared.muted}>
          {ready
            ? "No categories yet."
            : "Save a few more reels and KIRA will group them into categories."}
        </p>
      )}
      <div className={shared.cardList}>
        {themes?.map((t) => (
          <button
            key={t.name}
            className={`${shared.card} ${styles.row}`}
            onClick={() => router.push(`/category/${encodeURIComponent(t.name)}`)}
          >
            <div className={styles.rowText}>
              <div className={styles.rowName}>{t.name}</div>
              <div className={styles.rowWhy}>{t.why}</div>
            </div>
            <span className={styles.rowCount}>{t.count}</span>
          </button>
        ))}
      </div>
      <BottomNav active="categories" />
    </main>
  );
}
