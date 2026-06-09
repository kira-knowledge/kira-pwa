"use client";
import { useRouter } from "next/navigation";
import styles from "./BottomNav.module.css";

type Tab = "history" | "home" | "categories";

export default function BottomNav({ active }: { active?: Tab }) {
  const router = useRouter();
  const item = (tab: Tab, href: string, label: string, icon: string) => (
    <button
      className={active === tab ? `${styles.item} ${styles.active}` : styles.item}
      onClick={() => router.push(href)}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
  return (
    <nav className={styles.bar}>
      {item("history", "/history", "History", "🕑")}
      {item("home", "/", "Home", "🏠")}
      {item("categories", "/categories", "Categories", "🗂")}
    </nav>
  );
}
