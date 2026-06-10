"use client";
import { useEffect, useState } from "react";

import styles from "./InstallPrompt.module.css";
import { PhoneKIcon } from "../components/icons/Icons";

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

  // Installed (running standalone, or just installed from this tab) → nothing to prompt.
  if (standalone || installed) return null;

  const installContent = (
    <>
      <PhoneKIcon height={60} />
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
