"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";
import { formatDateLong } from "../../lib/billing";
import styles from "./subscription.module.css";

type SubView = {
  plan: "free" | "pro";
  priceUsd?: number;
  startDate?: string | null;
  nextRenewal?: string | null;
  cancelAtPeriodEnd?: boolean;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [sub, setSub] = useState<SubView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/stripe/subscription", { cache: "no-store" });
        if (!r.ok) throw new Error("fetch failed");
        const data: SubView = await r.json();
        if (!active) return;
        if (data.plan !== "pro") {
          router.replace("/upgrade");
          return;
        }
        setSub(data);
      } catch {
        if (active) setError("Couldn't load your subscription.");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function cancelSubscription() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await r.json().catch(() => null);
      if (!r.ok || !data?.url) throw new Error("portal failed");
      window.location.assign(data.url);
    } catch {
      setError("Couldn't open the billing portal — try again.");
      setBusy(false);
    }
  }

  const price = sub ? `$${sub.priceUsd ?? 2}` : "—";
  const details: Array<[string, string]> = [
    ["Plan", "Monthly plan"],
    ["Start Date", sub ? formatDateLong(sub.startDate) : "—"],
    ["Next Renewal", sub ? formatDateLong(sub.nextRenewal) : "—"],
    ["Amount Paid", price],
  ];

  return (
    <main className={styles.wrap}>
      <TopBar />
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Back">‹</button>
        <h1 className={styles.title}>Subscription Details</h1>
      </header>

      <section className={styles.planCard}>
        <div>
          <div className={styles.planName}>Your plan</div>
          <div className={styles.planSub}>Monthly payment</div>
        </div>
        <div className={styles.planPrice}>{price}</div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>Subscription Details</div>
        {details.map(([k, v]) => (
          <div key={k} className={styles.row}>
            <span className={styles.rowLabel}>{k}</span>
            <span className={styles.rowValue}>{v}</span>
          </div>
        ))}
      </section>

      <p className={styles.disclaimer}>Disclaimer: All plans can be cancelled at any time.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.primary} onClick={() => router.push("/")}>Return Home</button>
      {sub?.cancelAtPeriodEnd ? (
        <p className={styles.cancelNote}>
          Cancels on {formatDateLong(sub.nextRenewal)}
        </p>
      ) : (
        <button className={styles.cancel} onClick={cancelSubscription} disabled={busy || !sub}>
          {busy ? "Opening portal…" : "Cancel Subscription"}
        </button>
      )}
      <BottomNav />
    </main>
  );
}
