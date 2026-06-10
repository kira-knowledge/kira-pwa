"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./history.module.css";
import shared from "../shared.module.css";
import TopBar from "../../components/TopBar";
import SearchBox from "../../components/SearchBox";
import CategoryPills from "../../components/CategoryPills";
import BottomNav from "../../components/BottomNav";
import { ChatRecord, loadHistory } from "../../lib/chatHistory";
import { savedLabel } from "../../lib/savedLabel";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ChatRecord[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  return (
    <main className={shared.wrap}>
      <TopBar />
      <h2 className={shared.sectionTitle}>Your recent searches</h2>
      {history.length === 0 && <p className={shared.muted}>No conversations yet.</p>}
      <div className={shared.cardList}>
        {history.map((h) => (
          <button
            key={h.id}
            className={`${shared.card} ${styles.chatCard}`}
            onClick={() => router.push(`/chat?history=${encodeURIComponent(h.id)}`)}
          >
            <span className={styles.chatQuestion}>{h.question}</span>
            {h.theme && <span className={styles.chatTheme}>{h.theme}</span>}
            <span className={styles.chatDate}>{savedLabel(h.ts)}</span>
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <p className={styles.finePrint}>Only the 10 most recent searches are saved.</p>
      )}

      <SearchBox placeholder="Looking for something new?" variant="navy" />

      <h2 className={shared.sectionTitle}>Explore other Knowledge</h2>
      <CategoryPills />

      <BottomNav active="history" />
    </main>
  );
}
