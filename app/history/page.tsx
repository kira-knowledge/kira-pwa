"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../../components/BottomNav";
import { ChatRecord, loadHistory } from "../../lib/chatHistory";
import styles from "../page.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ChatRecord[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.brand}>History</h1>
      </header>
      {history.length === 0 && <p className={styles.muted}>No conversations yet.</p>}
      <div className={styles.catList}>
        {history.map((h) => (
          <button
            key={h.id}
            className={styles.catItem}
            onClick={() => router.push(`/chat?history=${encodeURIComponent(h.id)}`)}
          >
            <div>
              <div className={styles.catName}>🕑 {h.question}</div>
              {h.theme && <div className={styles.catWhy}>{h.theme}</div>}
            </div>
          </button>
        ))}
      </div>
      <BottomNav active="history" />
    </main>
  );
}
