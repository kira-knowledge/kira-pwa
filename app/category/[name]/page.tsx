"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../../../components/BottomNav";
import PostCard, { PostItem } from "../../../components/PostCard";
import { filterByCategory } from "../../../lib/categoryFilter";
import styles from "../../page.module.css";

export default function CategoryViewer({ params }: { params: { name: string } }) {
  const router = useRouter();
  const name = decodeURIComponent(params.name);
  const [items, setItems] = useState<PostItem[] | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [tr, lr] = await Promise.all([
          fetch("/api/themes", { cache: "no-store" }),
          fetch("/api/library", { cache: "no-store" }),
        ]);
        const td = await tr.json();
        const all: PostItem[] = await lr.json();
        const theme = (td?.themes ?? []).find((t: any) => t.name === name);
        if (!theme) {
          setStale(true);
          setItems([]);
          return;
        }
        setItems(filterByCategory(all, theme.source_urls ?? []));
      } catch {
        setItems([]);
      }
    })();
  }, [name]);

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.refresh} onClick={() => router.push("/categories")}>
          ← Categories
        </button>
        <h1 className={styles.brand}>{name}</h1>
      </header>
      {items === null && <p className={styles.muted}>Loading…</p>}
      {stale && (
        <p className={styles.muted}>
          This category changed as new posts came in. Head back to Categories.
        </p>
      )}
      <section className={styles.grid}>
        {items?.map((it) => (
          <PostCard key={it.id} item={it} />
        ))}
      </section>
      <BottomNav />
    </main>
  );
}
