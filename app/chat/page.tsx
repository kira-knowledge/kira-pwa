"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "./chat.module.css";
import AnswerWithCitations from "../../components/AnswerWithCitations";
import SourceCard from "../../components/SourceCard";
import { ChatRecord, Citation, appendHistory, loadHistory } from "../../lib/chatHistory";

type ChatResponse = {
  answer: string;
  citations: Citation[];
  suggested: string[];
  grounded_by: string;
};

const themeQuestion = (name: string) =>
  `Give me an overview of what my saves about "${name}" cover and what I could do with them.`;

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function ChatInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "answered" | "error">("idle");
  const [current, setCurrent] = useState<ChatRecord | null>(null);
  const [history, setHistory] = useState<ChatRecord[]>([]);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("Ask KIRA");
  const [deepen, setDeepen] = useState("");
  const started = useRef(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function ask(question: string, themeSourceUrls?: string[], theme?: string) {
    setStatus("loading");
    setDeepen("");
    setCurrent({
      id: makeId(), question, answer: "", citations: [], suggested: [],
      grounded_by: "", ts: Date.now(), theme,
    });
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, theme_source_urls: themeSourceUrls }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: ChatResponse = await r.json();
      const record: ChatRecord = {
        id: makeId(), question, answer: data.answer,
        citations: data.citations ?? [], suggested: data.suggested ?? [],
        grounded_by: data.grounded_by ?? "", ts: Date.now(), theme,
      };
      setCurrent(record);
      setStatus("answered");
      setHistory(appendHistory(record));
    } catch {
      setStatus("error");
    }
  }

  // Resolve the navigation intent once on mount.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const q = params.get("q");
    const theme = params.get("theme");
    if (theme) {
      setTitle(theme);
      (async () => {
        let urls: string[] | undefined;
        try {
          const tr = await fetch("/api/themes", { cache: "no-store" });
          const td = await tr.json();
          urls = (td?.themes ?? []).find((t: any) => t.name === theme)?.source_urls;
        } catch {
          urls = undefined;
        }
        // Stale theme (not found) → free-text question, no scope.
        ask(themeQuestion(theme), urls && urls.length ? urls : undefined, theme);
      })();
    } else if (q) {
      ask(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput("");
    ask(q);
  }

  async function goDeeper() {
    if (!current) return;
    setDeepen("Searching…");
    try {
      const r = await fetch("/api/deepen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: current.question }),
      });
      const data = await r.json();
      setDeepen(data?.message ?? "Exa coming soon.");
    } catch {
      setDeepen("Exa coming soon.");
    }
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push("/")}>←</button>
        <h1 className={styles.title}>{title}</h1>
      </header>

      {status === "idle" && (
        <section className={styles.recent}>
          <div className={styles.recentLabel}>RECENT</div>
          {history.length === 0 && (
            <p className={styles.muted}>Ask KIRA anything about your saves.</p>
          )}
          {history.map((h) => (
            <button
              key={h.id}
              className={styles.recentItem}
              onClick={() => {
                setCurrent(h);
                setTitle(h.theme ?? "Ask KIRA");
                setStatus("answered");
              }}
            >
              🕑 {h.question}
            </button>
          ))}
        </section>
      )}

      {current && status !== "idle" && (
        <section className={styles.thread}>
          <div className={styles.question}>{current.question}</div>
          {status === "loading" && (
            <p className={styles.muted}>KIRA is reading your saves…</p>
          )}
          {status === "error" && (
            <p className={styles.error}>KIRA couldn&rsquo;t answer that — try again.</p>
          )}
          {status === "answered" && (
            <>
              <AnswerWithCitations answer={current.answer} citations={current.citations} />
              {current.citations.length > 0 && (
                <div className={styles.sources}>
                  <div className={styles.recentLabel}>SOURCES</div>
                  {current.citations.map((c) => (
                    <SourceCard key={c.n} citation={c} />
                  ))}
                </div>
              )}
              {current.suggested.length > 0 && (
                <div className={styles.chips}>
                  {current.suggested.map((s) => (
                    <button key={s} className={styles.chip} onClick={() => ask(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <button className={styles.deepen} onClick={goDeeper}>
                Go deeper (Exa)
              </button>
              {deepen && <p className={styles.muted}>{deepen}</p>}
            </>
          )}
        </section>
      )}

      <form className={styles.askBar} onSubmit={submit}>
        <input
          className={styles.askInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your saves…"
        />
        <button className={styles.askSend} type="submit">Ask</button>
      </form>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatInner />
    </Suspense>
  );
}
