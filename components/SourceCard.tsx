"use client";
import { Citation } from "../lib/chatHistory";
import { citationThumbSrc } from "../lib/citationThumb";
import styles from "../app/chat/chat.module.css";

export default function SourceCard({ citation }: { citation: Citation }) {
  // Raw citation.thumbnail URLs are CORP-blocked by the browser; go through
  // the same-origin /api/thumb proxy instead (empty when underivable).
  const thumb = citationThumbSrc(citation.source_url);
  return (
    <a
      id={`source-${citation.n}`}
      className={styles.sourceCard}
      href={citation.source_url}
      target="_blank"
      rel="noreferrer"
    >
      {thumb ? (
        <img
          className={styles.sourceThumb}
          src={thumb}
          alt=""
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
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
