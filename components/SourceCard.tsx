"use client";
import { Citation } from "../lib/chatHistory";
import styles from "../app/chat/chat.module.css";

export default function SourceCard({ citation }: { citation: Citation }) {
  return (
    <a
      id={`source-${citation.n}`}
      className={styles.sourceCard}
      href={citation.source_url}
      target="_blank"
      rel="noreferrer"
    >
      {citation.thumbnail ? (
        <img className={styles.sourceThumb} src={citation.thumbnail} alt="" />
      ) : (
        <div className={styles.sourceThumbFallback} />
      )}
      <div>
        <span className={styles.citeMark}>[{citation.n}]</span>{" "}
        <strong>{citation.title}</strong>
        <div className={styles.sourceAuthor}>@{citation.author} ↗</div>
      </div>
    </a>
  );
}
