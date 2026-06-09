"use client";
import { useRouter } from "next/navigation";
import styles from "../app/page.module.css";

export type PostItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  thumbnail: string;
  source_url: string;
};

export default function PostCard({ item }: { item: PostItem }) {
  const router = useRouter();
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
      {item.thumbnail ? (
        <img
          className={styles.thumb}
          src={item.thumbnail}
          alt=""
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className={styles.thumbFallback} />
      )}
      <div className={styles.body}>
        <h2 className={styles.title}>{item.title}</h2>
        <p className={styles.summary}>{item.summary}</p>
        <div className={styles.tags}>
          {item.tags?.map((t, j) => (
            <span key={j} className={styles.tag}>
              #{t}
            </span>
          ))}
        </div>
        <div className={styles.meta}>
          <span>@{item.author}</span>
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Source ↗
          </a>
        </div>
      </div>
    </article>
  );
}
