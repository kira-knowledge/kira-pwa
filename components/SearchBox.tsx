"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchBox.module.css";
import { SearchIcon } from "./icons/Icons";

export default function SearchBox({
  placeholder,
  variant = "light",
}: {
  placeholder: string;
  variant?: "light" | "navy";
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  }

  return (
    <form
      className={variant === "navy" ? `${styles.box} ${styles.navy}` : styles.box}
      onSubmit={submit}
    >
      <input
        className={styles.input}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
      />
      <button className={styles.iconBtn} type="submit" aria-label="Search">
        <SearchIcon size={28} />
      </button>
    </form>
  );
}
