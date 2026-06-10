"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Splash.module.css";
import { KiraMark } from "./icons/Icons";
import { shouldShowSplash } from "../lib/splash";

const FLAG = "kira-splash-shown";

// Timing constants — fadeMs MUST match the `transition: opacity` duration in Splash.module.css
const TIMING = { holdMs: 1600, fadeMs: 500 } as const;

export default function Splash() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "showing" | "leaving">("hidden");

  // `decided` survives React 18 StrictMode's double-invoke: the ref is created
  // once per component instance and is preserved across the cleanup+remount cycle
  // that StrictMode uses to detect side-effect leaks.
  //
  // Without this ref the sequence in dev is:
  //   Run 1: flag absent → write flag, setPhase("showing"), schedule timers
  //   Cleanup: timers cleared, phase stays "showing"
  //   Run 2: flag now present → early return → timers never rescheduled → stuck
  //
  // With the ref:
  //   Run 1: decided=null → evaluate once, write flag if showing, schedule timers
  //   Cleanup: timers cleared; decided=true persists
  //   Run 2: decided already set → skip re-evaluation, re-schedule timers → splash completes
  const decided = useRef<boolean | null>(null);

  useEffect(() => {
    // Evaluate visibility exactly once per component instance (not per effect run).
    if (decided.current === null) {
      let flag: string | null = null;
      try {
        flag = sessionStorage.getItem(FLAG);
      } catch {
        flag = "1"; // storage unavailable -> never block the app
      }
      decided.current = shouldShowSplash(pathname ?? "/", flag);
      if (decided.current) {
        try {
          sessionStorage.setItem(FLAG, "1");
        } catch {}
      }
    }

    if (!decided.current) return;

    // (Re-)schedule timers on every effect run so StrictMode's second run
    // correctly drives the animation to completion.
    setPhase("showing");
    const leave = setTimeout(() => setPhase("leaving"), TIMING.holdMs);
    const gone = setTimeout(() => setPhase("hidden"), TIMING.holdMs + TIMING.fadeMs);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
    // pathname is intentionally captured once on mount. Adding it to the deps
    // array would re-fire the splash on every client-side navigation, which is
    // not the desired behaviour (session-once).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "hidden") return null;
  return (
    <div className={phase === "leaving" ? `${styles.splash} ${styles.leaving}` : styles.splash} aria-hidden="true">
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to KIRA!</h1>
        <div className={styles.mark}>
          <KiraMark size={240} plain />
        </div>
        <p className={styles.tagline}>Find what&rsquo;s forgotten?</p>
      </div>
    </div>
  );
}
