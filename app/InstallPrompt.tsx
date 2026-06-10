"use client";
import { useEffect, useState } from "react";

import styles from "./InstallPrompt.module.css";
import { KiraMark } from "../components/icons/Icons";

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
      <div className={styles.installStatic}>
        <KiraMark size={40} />
        <span className={styles.installCol}>
          <span className={styles.installTitle}>KIRA is ready</span>
          <span className={styles.installSub}>
            In Instagram, tap <strong>Share → KIRA</strong> on any reel to save it here.
          </span>
        </span>
      </div>
    );
  }

  // Just installed (still in the browser tab).
  if (installed) {
    return (
      <div className={styles.installStatic}>
        <KiraMark size={40} />
        <span className={styles.installCol}>
          <span className={styles.installTitle}>Added to your home screen!</span>
          <span className={styles.installSub}>
            Open KIRA from your home screen, then in Instagram tap <strong>Share → KIRA</strong>.
          </span>
        </span>
      </div>
    );
  }

  const installContent = (
    <>
      <KiraMark size={40} />
      <span className={styles.installCol}>
        <span className={styles.installTitle}>Add KIRA to your phone!</span>
        <span className={styles.installSub}>
          In your browser → Select <strong>Add to Home Screen</strong> to enable direct sharing via your Instagram App.
        </span>
      </span>
    </>
  );

  // No captured prompt (iOS Safari etc.): the copy is manual install guidance,
  // so show it as a non-clickable card instead of a dead button.
  if (!deferred) {
    return <div className={styles.installStatic}>{installContent}</div>;
  }

  // Install-available branch: tapping triggers the native install prompt.
  return (
    <button className={styles.installCard} onClick={handleInstall}>
      {installContent}
    </button>
  );
}
