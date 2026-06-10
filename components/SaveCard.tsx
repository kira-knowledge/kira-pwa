"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SaveCard.module.css";
import { thumbSrc } from "../lib/thumb";
import { savedLabel } from "../lib/savedLabel";

export type SaveItem = {
  id: string;
  title: string;
  summary: string;
  author: string;
  created_at: string;
  thumb_key?: string;
};

export default function SaveCard({
  item,
  className,
}: {
  item: SaveItem;
  className?: string;
}) {
  const router = useRouter();
  const [thumbFailed, setThumbFailed] = useState(false);
  const src = thumbSrc(item);
  useEffect(() => {
    setThumbFailed(false);
  }, [src]);
  return (
    <button
      type="button"
      className={className}
      onClick={() => router.push(`/post/${encodeURIComponent(item.id)}`)}
    >
      <span className={styles.row}>
        {src && !thumbFailed && (
          <img
            className={styles.thumb}
            src={src}
            alt=""
            onError={() => setThumbFailed(true)}
          />
        )}
        <span className={styles.col}>
          <span className={styles.title}>{item.title}</span>
          <span className={styles.meta}>Instagram &bull; {item.author}</span>
          <span className={styles.date}>{savedLabel(item.created_at)}</span>
        </span>
      </span>
    </button>
  );
}
