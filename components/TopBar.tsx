"use client";
import { useRouter } from "next/navigation";
import styles from "./TopBar.module.css";
import { ProfileIcon } from "./icons/Icons";
import { usePlan } from "../lib/usePlan";
import { createClient } from "../lib/supabase/client";

export default function TopBar() {
  const router = useRouter();
  const { plan, signedIn } = usePlan();

  async function signOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      // session may already be gone — head to /login regardless
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={styles.bar}>
      <span className={styles.logo}>K</span>
      <div className={styles.account}>
        {signedIn && (
          <span
            className={plan === "pro" ? `${styles.badge} ${styles.pro}` : styles.badge}
          >
            {plan === "pro" ? "PRO" : "FREE"}
          </span>
        )}
        <button
          type="button"
          className={styles.profile}
          onClick={signedIn ? signOut : undefined}
          disabled={!signedIn}
          aria-label={signedIn ? "Sign out" : "Profile"}
        >
          <ProfileIcon size={38} />
        </button>
      </div>
    </div>
  );
}
