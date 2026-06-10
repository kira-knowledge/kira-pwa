"use client";
import { splitCitations } from "../lib/citations";
import { parseAnswerBlocks } from "../lib/answerFormat";
import styles from "../app/chat/chat.module.css";

export default function AnswerWithCitations<T extends { n: number }>({
  answer,
  citations,
  anchorPrefix = "source",
}: {
  answer: string;
  citations: T[];
  anchorPrefix?: string;
}) {
  const blocks = parseAnswerBlocks(answer);

  const renderText = (text: string, key: string) =>
    splitCitations(text, citations).map((seg, i) =>
      seg.citation ? (
        <a
          key={`${key}-${i}`}
          href={`#${anchorPrefix}-${seg.citation.n}`}
          className={styles.citeMark}
        >
          {seg.text}
        </a>
      ) : (
        <span key={`${key}-${i}`}>{seg.text}</span>
      )
    );

  return (
    <div className={styles.answer}>
      {blocks.map((b, bi) => {
        if (b.type === "para") {
          return (
            <p key={bi} className={styles.answerPara}>
              {renderText(b.text, `p${bi}`)}
            </p>
          );
        }
        const items = b.items.map((it, ii) => (
          <li key={ii}>{renderText(it, `l${bi}-${ii}`)}</li>
        ));
        return b.ordered ? (
          <ol key={bi} className={styles.answerList}>
            {items}
          </ol>
        ) : (
          <ul key={bi} className={styles.answerList}>
            {items}
          </ul>
        );
      })}
    </div>
  );
}
