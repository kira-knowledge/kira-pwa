"use client";
import { useRouter } from "next/navigation";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";
import styles from "./subscription.module.css";

const DETAILS: Array<[string, string]> = [
  ["Plan", "Monthly plan"],
  ["Start Date", "21 June 2025"],
  ["Next Renewal", "20 July 2026"],
  ["Amount Paid", "$2"],
];

export default function SubscriptionPage() {
  const router = useRouter();

  function cancelSubscription() {
    // TODO: Stripe customer portal — redirect to the billing portal session.
  }

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
        <div className={styles.planPrice}>$2</div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>Subscription Details</div>
        {DETAILS.map(([k, v]) => (
          <div key={k} className={styles.row}>
            <span className={styles.rowLabel}>{k}</span>
            <span className={styles.rowValue}>{v}</span>
          </div>
        ))}
      </section>

      <p className={styles.disclaimer}>Disclaimer: All plans can be cancelled at any time.</p>
      <button className={styles.primary} onClick={() => router.push("/")}>Return Home</button>
      <button className={styles.cancel} onClick={cancelSubscription}>Cancel Subscription</button>
      <BottomNav />
    </main>
  );
}
