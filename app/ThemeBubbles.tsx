"use client";
import styles from "./page.module.css";

export type Theme = {
  name: string;
  why: string;
  count: number;
  source_urls: string[];
};

type Props = {
  themes: Theme[];
  activeTheme: string | null;
  onSelect: (name: string | null) => void;
};

export default function ThemeBubbles({ themes, activeTheme, onSelect }: Props) {
  if (!themes || themes.length === 0) return null;
  return (
    <div className={styles.bubbles}>
      {themes.map((t) => {
        const active = t.name === activeTheme;
        return (
          <button
            key={t.name}
            className={
              active ? `${styles.bubble} ${styles.bubbleActive}` : styles.bubble
            }
            title={t.why}
            aria-pressed={active}
            onClick={() => onSelect(active ? null : t.name)}
          >
            {t.name}
            <span className={styles.bubbleCount}>{t.count}</span>
          </button>
        );
      })}
    </div>
  );
}
