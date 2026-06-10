"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./PostCard.module.css";
import { thumbSrc } from "../lib/thumb";

export type PostItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  thumbnail: string;
  thumb_key?: string;
  source_url: string;
};

export default function PostCard({ item }: { item: PostItem }) {
  const router = useRouter();
  const [thumbFailed, setThumbFailed] = useState(false);
  const src = thumbSrc(item);
  useEffect(() => {
    setThumbFailed(false);
  }, [src]);
  const open = () => router.push(`/post/${encodeURIComponent(item.id)}`);
  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open();
      }}
    >
      <div className={styles.row}>
        {src && !thumbFailed && (
          <img
            className={styles.thumb}
            src={src}
            alt=""
            onError={() => setThumbFailed(true)}
          />
        )}
        <div className={styles.body}>
          <h2 className={styles.title}>{item.title}</h2>
          <p className={styles.summary}>{item.summary}</p>
        </div>
      </div>
      <div className={styles.tags}>
        {item.tags?.map((t, j) => (
          <span key={j} className={styles.tag}>
            #{t}
          </span>
        ))}
      </div>
      <div className={styles.meta}>
        <span>Instagram &bull; {item.author}</span>
        <a
          href={item.source_url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Source &#8599;
        </a>
      </div>
    </article>
  );
}
