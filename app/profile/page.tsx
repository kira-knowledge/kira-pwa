"use client";
import { useRouter } from "next/navigation";
import BottomNav from "../../components/BottomNav";
import { usePlan } from "../../lib/usePlan";
import { useUser } from "../../lib/useUser";
import { createClient } from "../../lib/supabase/client";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { plan, loading } = usePlan();
  const { email, fullName } = useUser();

  async function logOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      // session may already be gone — head to /login regardless
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <main className={styles.wrap}>
      <button
        className={styles.close}
        onClick={() => router.back()}
        aria-label="Close"
      >
        ✕
      </button>

      <div className={styles.avatar} aria-hidden="true" />
      <h1 className={styles.name}>{fullName ?? email ?? "Your account"}</h1>

      <section className={styles.card}>
        <div className={styles.cardHead}>Contact Details</div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Email ID</span>
          <span className={styles.rowValue}>{email ?? "—"}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel} />
          <span className={styles.rowHint}>Reset Password</span>
        </div>

        {/* Wait for the plan fetch so PRO users never flash a "Free User" row. */}
        {loading ? (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Status</span>
            <span className={styles.rowValue}>…</span>
          </div>
        ) : plan === "pro" ? (
          <button
            className={`${styles.row} ${styles.rowButton}`}
            onClick={() => router.push("/subscription")}
          >
            <span className={styles.rowLabel}>Status</span>
            <span className={styles.rowValue}>Pro User ›</span>
          </button>
        ) : (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Status</span>
            <span className={styles.rowValue}>Free User</span>
          </div>
        )}
      </section>

      {!loading && plan === "free" && (
        <button
          className={styles.primary}
          onClick={() => router.push("/upgrade")}
        >
          Upgrade
        </button>
      )}

      {!loading && plan === "pro" && (
        <button className={styles.primary} onClick={() => router.push("/")}>
          Return to Home Page
        </button>
      )}

      <button className={styles.logout} onClick={logOut}>
        Log Out
      </button>

      <BottomNav />
    </main>
  );
}
