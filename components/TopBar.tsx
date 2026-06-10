"use client";
import { useRouter } from "next/navigation";
import styles from "./TopBar.module.css";
import { KiraMark, ProfileIcon } from "./icons/Icons";

export default function TopBar() {
  const router = useRouter();
  return (
    <div className={styles.bar}>
      <KiraMark size={38} />
      <button
        type="button"
        className={styles.profile}
        onClick={() => router.push("/profile")}
        aria-label="Profile"
      >
        <ProfileIcon size={38} />
      </button>
    </div>
  );
}
