"use client";
import { Citation } from "../lib/chatHistory";
import styles from "../app/chat/chat.module.css";

export default function SourceCard({ citation }: { citation: Citation }) {
  return (
    <a
      id={`source-${citation.n}`}
      className={styles.sourceLine}
      href={citation.source_url}
      target="_blank"
      rel="noreferrer"
    >
      [{citation.n}] {citation.title} @{citation.author} ↗
    </a>
  );
}
