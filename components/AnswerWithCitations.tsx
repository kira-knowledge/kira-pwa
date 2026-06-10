"use client";
import { splitCitations } from "../lib/citations";
import { parseAnswerBlocks } from "../lib/answerFormat";
import { parseInline } from "../lib/inlineMarkdown";
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

  const renderSegments = (text: string, key: string) =>
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

  // Inline markdown first, then citations inside each span, so bold text
  // containing a [n] marker still gets a working citation link.
  const renderText = (text: string, key: string) =>
    parseInline(text).map((span, si) => {
      const inner = renderSegments(span.text, `${key}-s${si}`);
      if (span.bold) return <strong key={`${key}-s${si}`}>{inner}</strong>;
      if (span.italic) return <em key={`${key}-s${si}`}>{inner}</em>;
      if (span.code)
        return (
          <code key={`${key}-s${si}`} className={styles.answerCode}>
            {inner}
          </code>
        );
      return <span key={`${key}-s${si}`}>{inner}</span>;
    });

  return (
    <div className={styles.answer}>
      {blocks.map((b, bi) => {
        if (b.type === "heading") {
          return (
            <h3 key={bi} className={styles.answerHeading}>
              {renderText(b.text, `h${bi}`)}
            </h3>
          );
        }
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
