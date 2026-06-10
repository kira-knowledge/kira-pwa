"use client";
import styles from "./Pagination.module.css";

export default function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav className={styles.row} aria-label="Pagination">
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === page ? styles.active : styles.page}
          aria-current={p === page ? "page" : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
    </nav>
  );
}
