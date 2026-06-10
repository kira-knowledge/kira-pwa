"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import shared from "../../../shared.module.css";
import styles from "../category.module.css";
import TopBar from "../../../../components/TopBar";
import BottomNav from "../../../../components/BottomNav";
import PostCard, { PostItem } from "../../../../components/PostCard";
import Pagination from "../../../../components/Pagination";
import { filterByCategory, filterUnclassified } from "../../../../lib/categoryFilter";
import { paginate, PER_PAGE } from "../../../../lib/paginate";

export default function CategoryAll({ params }: { params: { name: string } }) {
  const router = useRouter();
  const name = decodeURIComponent(params.name);
  const [items, setItems] = useState<PostItem[] | null>(null);
  const [stale, setStale] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
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

  const paged = paginate(items ?? [], page, PER_PAGE);

  return (
    <main className={shared.wrap}>
      <TopBar />
      <header className={styles.pageHead}>
        <button
          className={styles.back}
          onClick={() => router.push(`/category/${encodeURIComponent(name)}`)}
          aria-label="Back"
        >
          ‹
        </button>
        <h2 className={shared.sectionTitle}>All saves in {name}</h2>
      </header>
      {items === null && <p className={shared.muted}>Loading&hellip;</p>}
      {stale && (
        <p className={shared.muted}>
          This category changed as new posts came in. Head back to Categories.
        </p>
      )}
      {items?.length === 0 && !stale && (
        <p className={shared.muted}>No posts here yet.</p>
      )}
      <div className={shared.cardList}>
        {paged.pageItems.map((it) => (
          <PostCard key={it.id} item={it} />
        ))}
      </div>
      <Pagination page={paged.page} pageCount={paged.pageCount} onChange={setPage} />
      <BottomNav active="categories" />
    </main>
  );
}
