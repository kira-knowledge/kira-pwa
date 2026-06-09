import styles from "./TopBar.module.css";
import { ProfileIcon } from "./icons/Icons";

export default function TopBar() {
  return (
    <div className={styles.bar}>
      <span className={styles.logo}>K</span>
      {/* Decorative — the app has no accounts (spec decision 4). */}
      <span className={styles.profile} aria-hidden="true">
        <ProfileIcon size={38} />
      </span>
    </div>
  );
}
