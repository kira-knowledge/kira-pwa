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

  const text: Record<Phase, string> = {
    saving: "Saving to KIRA…",
    saved: "Saved ✓",
    nolink: "No Instagram link found",
    error: "Couldn't save",
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.toast}>
        <div className={styles.big}>{text[phase]}</div>
        {phase === "saved" && showReturn && (
          <div className={styles.hint}>You can return to Instagram.</div>
        )}
        {(phase === "nolink" || phase === "error") && (
          <a className={styles.link} href="/">
            Open KIRA →
          </a>
        )}
      </div>
    </main>
  );
}
