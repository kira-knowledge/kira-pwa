"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "./chat.module.css";
import AnswerWithCitations from "../../components/AnswerWithCitations";
import SourceCard from "../../components/SourceCard";
import WebResultCard from "../../components/WebResultCard";
import { parseDeepenResponse, WebResult } from "../../lib/deepen";
import { ChatRecord, Citation, appendHistory, findById, loadHistory } from "../../lib/chatHistory";
import { usePlan } from "../../lib/usePlan";
import { goDeeperButton } from "../../lib/goDeeper";

type ChatResponse = {
  answer: string;
  citations: Citation[];
  suggested: string[];
  grounded_by: string;
};

type DeepenState = {
  status: "idle" | "loading" | "done" | "error";
  synthesis: string;
  results: WebResult[];
};

const themeQuestion = (name: string) =>
  `Give me an overview of what my saves about "${name}" cover and what I could do with them.`;

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function ChatInner() {
  const router = useRouter();
  const params = useSearchParams();
  const hasIntent = !!(params.get("theme") || params.get("q") || params.get("history"));
  const [status, setStatus] = useState<"idle" | "loading" | "answered" | "error">(
    hasIntent ? "loading" : "idle"
  );
  const [current, setCurrent] = useState<ChatRecord | null>(null);
  const [history, setHistory] = useState<ChatRecord[]>([]);
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("Ask KIRA");
  const [deepen, setDeepen] = useState<DeepenState>({ status: "idle", synthesis: "", results: [] });
  const [scopeUrls, setScopeUrls] = useState<string[] | undefined>(undefined);
  const started = useRef(false);
  const { plan } = usePlan();
  const deeperBtn = goDeeperButton(plan);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function ask(question: string, themeSourceUrls?: string[], theme?: string) {
    setStatus("loading");
    setDeepen({ status: "idle", synthesis: "", results: [] });
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
    const hist = params.get("history");
    if (hist) {
      const rec = findById(hist);
      if (rec) {
        setCurrent(rec);
        setTitle(rec.theme ?? "Ask KIRA");
        setStatus("answered");
      } else {
        setStatus("idle");
      }
      return;
    }
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
        const scoped = urls && urls.length ? urls : undefined;
        setScopeUrls(scoped);
        ask(themeQuestion(theme), scoped, theme);
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
    setScopeUrls(undefined);
    ask(q);
  }

  async function goDeeper() {
    if (!current) return;
    setDeepen({ status: "loading", synthesis: "", results: [] });
    try {
      const r = await fetch("/api/deepen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: current.question, theme_source_urls: scopeUrls }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = parseDeepenResponse(await r.json());
      setDeepen({ status: "done", synthesis: data.synthesis, results: data.results });
    } catch {
      setDeepen({ status: "error", synthesis: "", results: [] });
    }
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push("/")} aria-label="Back">‹</button>
        <h1 className={styles.title}>{title === "Ask KIRA" ? "Think KIRA" : title}</h1>
        <span className={styles.tagline}>Your knowledge, on demand.</span>
        <button className={styles.history} onClick={() => router.push("/history")}>History</button>
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
            <>
              <p className={styles.error}>KIRA couldn&rsquo;t answer that — try again.</p>
              <button type="button" className={styles.chip} onClick={() => ask(current.question)}>
                Retry
              </button>
            </>
          )}
          {status === "answered" && (
            <>
              <div className={styles.answerCard}>
                <AnswerWithCitations answer={current.answer} citations={current.citations} />
              </div>
              {current.citations.length > 0 && (
                <div className={styles.sources}>
                  <div className={styles.sourcesLabel}>Sources</div>
                  {current.citations.map((c) => (
                    <SourceCard key={c.n} citation={c} />
                  ))}
                </div>
              )}
              {current.suggested.length > 0 && (
                <div className={styles.chips}>
                  {[...new Set(current.suggested)].map((s) => (
                    <button key={s} type="button" className={styles.chip} onClick={() => { setScopeUrls(undefined); ask(s); }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <button
                className={styles.deepen}
                onClick={deeperBtn.action === "deepen" ? goDeeper : () => router.push("/upgrade")}
                disabled={deepen.status === "loading"}
              >
                {deeperBtn.label}
              </button>
              {deepen.status === "loading" && (
                <p className={styles.muted}>Searching the web…</p>
              )}
              {deepen.status === "error" && (
                <p className={styles.muted}>Couldn&rsquo;t reach the web right now.</p>
              )}
              {deepen.status === "done" && (
                <div className={styles.web}>
                  <div className={styles.recentLabel}>FROM THE WEB</div>
                  {deepen.results.length === 0 ? (
                    <p className={styles.muted}>No web results found.</p>
                  ) : (
                    <>
                      {deepen.synthesis && (
                        <AnswerWithCitations
                          answer={deepen.synthesis}
                          citations={deepen.results}
                          anchorPrefix="web-source"
                        />
                      )}
                      {deepen.results.map((r) => (
                        <WebResultCard key={r.n} result={r} />
                      ))}
                    </>
                  )}
                </div>
              )}
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
