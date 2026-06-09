"use client";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

export type Theme = {
  name: string;
  why: string;
  count: number;
  source_urls: string[];
};

type Props = { themes: Theme[] };

export default function ThemeBubbles({ themes }: Props) {
  const router = useRouter();
  if (!themes || themes.length === 0) return null;
  return (
    <div className={styles.bubbles}>
      {themes.map((t) => (
        <button
          key={t.name}
          className={styles.bubble}
          title={t.why}
          onClick={() => router.push(`/category/${encodeURIComponent(t.name)}`)}
        >
          {t.name}
          <span className={styles.bubbleCount}>{t.count}</span>
        </button>
      ))}
    </div>
  );
}
