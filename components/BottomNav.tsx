"use client";
import { useRouter } from "next/navigation";
import styles from "./BottomNav.module.css";
import { KnowledgeIcon, HistoryIcon, HomeIcon } from "./icons/Icons";

type Tab = "history" | "home" | "categories";

const TABS = [
  { tab: "history" as Tab, href: "/history", label: "History", Icon: HistoryIcon },
  { tab: "home" as Tab, href: "/", label: "Home", Icon: HomeIcon },
  { tab: "categories" as Tab, href: "/categories", label: "Knowledge", Icon: KnowledgeIcon },
];

export default function BottomNav({ active }: { active?: Tab }) {
  const router = useRouter();
  return (
    <nav className={styles.bar}>
      {TABS.map(({ tab, href, label, Icon }) => (
        <button
          key={tab}
          className={active === tab ? `${styles.item} ${styles.active}` : styles.item}
          onClick={() => router.push(href)}
        >
          <Icon size={24} />
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
