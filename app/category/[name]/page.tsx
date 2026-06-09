"use client";
import { useEffect, useState } from "react";

import styles from "./category.module.css";
import shared from "../../shared.module.css";
import TopBar from "../../../components/TopBar";
import BottomNav from "../../../components/BottomNav";
import CategoryPills from "../../../components/CategoryPills";
import PostCard, { PostItem } from "../../../components/PostCard";
import { filterByCategory } from "../../../lib/categoryFilter";

export default function CategoryViewer({ params }: { params: { name: string } }) {
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
    <main className={shared.wrap}>
      <TopBar />
      <h2 className={shared.sectionTitle}>{name}</h2>
      {items === null && <p className={shared.muted}>Loading&hellip;</p>}
      {stale && (
        <p className={styles.staleNote}>
          This category changed as new posts came in. Head back to Categories.
        </p>
      )}
      <div className={shared.cardList}>
        {items?.map((it) => (
          <PostCard key={it.id} item={it} />
        ))}
      </div>

      <h2 className={shared.sectionTitle}>Explore other categories</h2>
      <CategoryPills />

      <BottomNav active="categories" />
    </main>
  );
}
