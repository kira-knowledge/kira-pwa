"use client";
import { Citation } from "../lib/chatHistory";
import { splitCitations } from "../lib/citations";
import styles from "../app/chat/chat.module.css";

export default function AnswerWithCitations({
  answer,
  citations,
}: {
  answer: string;
  citations: Citation[];
}) {
  const segments = splitCitations(answer, citations);
  return (
    <p className={styles.answer}>
      {segments.map((seg, i) =>
        seg.citation ? (
          <a key={i} href={`#source-${seg.citation.n}`} className={styles.citeMark}>
            {seg.text}
          </a>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  );
}
