"use client";
import { useEffect, useState } from "react";

import styles from "./InstallPrompt.module.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setStandalone(isStandalone);

    const onPrompt = (e: Event) => {
      e.preventDefault(); // stop Chrome's default mini-infobar; we show our own button
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  // Already running as the installed app → show how to use it.
  if (standalone) {
    return (
      <div className={styles.installCard}>
        <span className={styles.installEmoji}>✅</span>
        <div className={styles.installText}>
          <strong>KIRA is ready</strong>
          <p className={styles.installHint}>
            In Instagram, tap <b>Share → KIRA</b> on any reel to save it here.
          </p>
        </div>
      </div>
    );
  }

  // Just installed (still in the browser tab).
  if (installed) {
    return (
      <div className={styles.installCard}>
        <span className={styles.installEmoji}>🎉</span>
        <div className={styles.installText}>
          <strong>Added to your home screen!</strong>
          <p className={styles.installHint}>
            Open KIRA from your home screen, then in Instagram tap <b>Share → KIRA</b>.
          </p>
        </div>
      </div>
    );
  }

  // Default card: one-tap install when the browser allows it, manual steps otherwise.
  return (
    <div className={styles.installCard}>
      <span className={styles.installEmoji}>📲</span>
      <div className={styles.installText}>
        <strong>Add KIRA to your phone</strong>
        <p className={styles.installHint}>
          {deferred ? (
            <>One tap, then share Instagram reels straight to KIRA.</>
          ) : (
            <>
              In Chrome: <b>⋮ → Add to Home screen</b>, then share reels via <b>Share → KIRA</b>.
            </>
          )}
        </p>
      </div>
      {deferred && (
        <button className={styles.installBtn} onClick={handleInstall}>
          Install
        </button>
      )}
    </div>
  );
}
