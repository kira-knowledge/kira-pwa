"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CategoryPills.module.css";

export type PillTheme = { name: string; why: string; count: number };

export default function CategoryPills({
  themes: external,
  max = 7,
}: {
  themes?: PillTheme[];
  max?: number;
}) {
  const router = useRouter();
  const [fetched, setFetched] = useState<PillTheme[]>([]);

  useEffect(() => {
    if (external) return;
    fetch("/api/themes", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setFetched(Array.isArray(d?.themes) ? d.themes : []))
      .catch(() => setFetched([]));
  }, [external]);

  const themes = external ?? fetched;

  return (
    <div className={styles.row}>
      {themes.slice(0, max).map((t) => (
        <button
          key={t.name}
          className={styles.pill}
          onClick={() => router.push(`/category/${encodeURIComponent(t.name)}`)}
        >
          {t.name}
        </button>
      ))}
      <button className={styles.pill} onClick={() => router.push("/categories")}>
        More...
      </button>
    </div>
  );
}
