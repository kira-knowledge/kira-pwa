"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Splash.module.css";
import { KiraMark } from "./icons/Icons";
import { shouldShowSplash } from "../lib/splash";

const FLAG = "kira-splash-shown";

export default function Splash() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "showing" | "leaving">("hidden");

  useEffect(() => {
    let flag: string | null = null;
    try {
      flag = sessionStorage.getItem(FLAG);
    } catch {
      flag = "1"; // storage unavailable -> never block the app
    }
    if (!shouldShowSplash(pathname ?? "/", flag)) return;
    try {
      sessionStorage.setItem(FLAG, "1");
    } catch {}
    setPhase("showing");
    const leave = setTimeout(() => setPhase("leaving"), 1600);
    const gone = setTimeout(() => setPhase("hidden"), 2100);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
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
