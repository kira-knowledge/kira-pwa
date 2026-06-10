"use client";
import { useEffect, useState } from "react";
import { extractInstagramUrl } from "../../lib/shareUrl";
import styles from "./share.module.css";

type Phase = "saving" | "saved" | "nolink" | "error";

export default function SharePage() {
  const [phase, setPhase] = useState<Phase>("saving");
  const [showReturn, setShowReturn] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const raw = `${p.get("url") ?? ""} ${p.get("text") ?? ""} ${p.get("title") ?? ""}`;
    const url = extractInstagramUrl(raw);
    if (!url) {
      setPhase("nolink");
      return;
    }
    fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((d) => setPhase(d.ok ? "saved" : "error"))
      .catch(() => setPhase("error"));
  }, []);

  // On success: brief toast, then try to auto-return to Instagram.
  useEffect(() => {
    if (phase !== "saved") return;
    const t = setTimeout(() => {
      window.close();
      // If the window is still here shortly after, close was blocked → show hint.
      setTimeout(() => setShowReturn(true), 250);
    }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <main className={styles.wrap}>
      {phase === "saving" && <div className={styles.big}>Saving to KIRA…</div>}
      {phase === "saved" && (
        <div className={styles.confirm}>
          <h1 className={styles.savedTitle}>Saved!</h1>
          <div className={styles.checkCircle}>
            <svg viewBox="0 0 52 52" className={styles.checkSvg} aria-hidden="true">
              <path className={styles.checkPath} fill="none" stroke="#fff" strokeWidth="5"
                strokeLinecap="round" d="M14 27l8 8 16-18" />
            </svg>
          </div>
          <p className={styles.savedSub}>Your post has been saved to KIRA</p>
          {showReturn && <p className={styles.hint}>You can return to Instagram.</p>}
        </div>
      )}
      {(phase === "nolink" || phase === "error") && (
        <div className={styles.confirm}>
          <div className={styles.big}>
            {phase === "nolink" ? "No Instagram link found" : "Couldn&rsquo;t save"}
          </div>
          <a className={styles.link} href="/">Open KIRA →</a>
        </div>
      )}
    </main>
  );
}
