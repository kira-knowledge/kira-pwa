"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "../../lib/usePlan";
import styles from "./upgrade.module.css";

const FEATURES: Array<[string, string]> = [
  ["Enhancement", "Find more suggestions similar to your saves"],
  ["Verification", "Validate content shared by creators online"],
  ["Brief BuilderAuto", "Generates a structured brief from all saves on a topic"],
  ["Knowledge Gaps", "Shows what you haven't saved, the blind spots in your topics"],
  ["Trend Alerts", "Notifies you when a topic in your KB is spiking online (via Exa)"],
  ["Stale Content Flag", "Marks saves that are outdated based on newer web info"],
];

export default function UpgradePage() {
  const router = useRouter();
  const { plan } = usePlan();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (plan === "pro") {
      router.push("/subscription");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/stripe/checkout", { method: "POST" });
      if (r.status === 409) {
        router.push("/subscription");
        return;
      }
      const data = await r.json().catch(() => null);
      if (!r.ok || !data?.url) {
        throw new Error(data?.error ?? "checkout failed");
      }
      window.location.assign(data.url);
    } catch {
      setError("Couldn't start checkout — try again.");
      setBusy(false);
    }
  }

  return (
    <main className={styles.wrap}>
      <button className={styles.back} onClick={() => router.back()} aria-label="Back">‹</button>
      <h1 className={styles.title}>Upgrade your KIRA</h1>
      <h2 className={styles.subtitle}>Want more from what you save?</h2>
      <p className={styles.lead}>
        Upgrade your KIRA to get advanced search and unlock all our features!
      </p>
      <ul className={styles.list}>
        {FEATURES.map(([k, v]) => (
          <li key={k} className={styles.item}>
            <span className={styles.check} aria-hidden="true">✓</span>
            <span><strong>{k}</strong> - {v}</span>
          </li>
        ))}
      </ul>
      <button className={styles.cta} onClick={startCheckout} disabled={busy}>
        {busy ? "Redirecting…" : plan === "pro" ? "Manage Subscription" : "Sign Up"}
      </button>
      {error && (
        <p className={styles.error} role="alert">{error}</p>
      )}
    </main>
  );
}
