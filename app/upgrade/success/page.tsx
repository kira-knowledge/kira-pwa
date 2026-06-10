"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./success.module.css";

type State = "confirming" | "pro" | "error";

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const ran = useRef(false); // StrictMode double-invoke guard (same pattern as the splash)
  const [state, setState] = useState<State>("confirming");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!sessionId) {
      router.replace("/upgrade");
      return;
    }
    (async () => {
      try {
        const r = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        setState(r.ok ? "pro" : "error");
      } catch {
        setState("error");
      }
    })();
  }, [sessionId, router]);

  if (state === "confirming") {
    return (
      <main className={styles.wrap}>
        <p className={styles.confirming}>Confirming your payment…</p>
      </main>
    );
  }
  if (state === "error") {
    return (
      <main className={styles.wrap}>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.lead}>
          We couldn&apos;t confirm your payment. If you were charged, your plan
          will update automatically in a moment.
        </p>
        <button className={styles.cta} onClick={() => router.replace("/upgrade")}>
          Back to Upgrade
        </button>
      </main>
    );
  }
  return (
    <main className={styles.wrap}>
      <div className={styles.party} aria-hidden="true">🎉</div>
      <h1 className={styles.title}>You&apos;re PRO</h1>
      <p className={styles.lead}>
        Welcome to KIRA Pro — Go Deeper, trend alerts and the whole toolkit are
        unlocked.
      </p>
      <button className={styles.cta} onClick={() => router.replace("/")}>
        Start exploring
      </button>
    </main>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
