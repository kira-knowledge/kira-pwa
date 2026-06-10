"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./category.module.css";
import shared from "../../shared.module.css";
import TopBar from "../../../components/TopBar";
import BottomNav from "../../../components/BottomNav";
import CategoryPills from "../../../components/CategoryPills";
import PostCard, { PostItem } from "../../../components/PostCard";
import { filterByCategory, filterUnclassified } from "../../../lib/categoryFilter";

const PREVIEW = 5;

export default function CategoryViewer({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  const router = useRouter();
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
        if (name === "Unclassified") {
          setItems(filterUnclassified(all, td?.themes ?? []));
          return;
        }
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
    <main className={shared.wrap}>
      <TopBar />
      <header className={styles.pageHead}>
        <button
          className={styles.back}
          onClick={() => router.back()}
          aria-label="Back"
        >
          ‹
        </button>
        <h2 className={shared.sectionTitle}>{name}</h2>
      </header>
      {items === null && <p className={shared.muted}>Loading&hellip;</p>}
      {stale && (
        <p className={styles.staleNote}>
          This category changed as new posts came in. Head back to Categories.
        </p>
      )}
      <div className={shared.cardList}>
        {items?.slice(0, PREVIEW).map((it) => (
          <PostCard key={it.id} item={it} />
        ))}
      </div>
      {items && items.length > PREVIEW && (
        <button
          className={styles.viewAll}
          onClick={() => router.push(`/category/${encodeURIComponent(name)}/all`)}
        >
          View all ({items.length}) &rarr;
        </button>
      )}

      <h2 className={shared.sectionTitle}>Explore other Knowledge</h2>
      <CategoryPills />

      <BottomNav active="categories" />
    </main>
  );
}
