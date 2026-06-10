"use client";
import { useRouter } from "next/navigation";
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

  function startCheckout() {
    // TODO: Stripe Checkout — create a Checkout Session server-side and redirect.
    // Wire here when Stripe is integrated; until then this is a visual stub.
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
      <button className={styles.cta} onClick={startCheckout}>Sign Up</button>
    </main>
  );
}
