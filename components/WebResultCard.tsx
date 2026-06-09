"use client";
import styles from "../app/chat/chat.module.css";
import { WebResult } from "../lib/deepen";

export default function WebResultCard({ result }: { result: WebResult }) {
  const meta = [result.site, result.published_date].filter(Boolean).join(" · ");
  return (
    <a
      id={`web-source-${result.n}`}
      className={styles.webCard}
      href={result.url}
      target="_blank"
      rel="noreferrer"
    >
      <div>
        <span className={styles.citeMark}>[{result.n}]</span>{" "}
        <strong>{result.title}</strong> <span className={styles.webBadge}>🌐</span>
        {meta && <div className={styles.webMeta}>{meta} ↗</div>}
        {result.snippet && <div className={styles.webSnippet}>{result.snippet}</div>}
      </div>
    </a>
  );
}
