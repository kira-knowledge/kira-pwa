"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    // Frontend-only for the demo: no account is created yet.
    setDone(true);
    setTimeout(() => router.push("/login"), 1400);
  }

  return (
    <main className={styles.wrap}>
      <button
        className={styles.back}
        onClick={() => router.push("/login")}
        aria-label="Back to log in"
      >
        ‹
      </button>
      <h1 className={styles.title}>Welcome to KIRA!</h1>
      {done ? (
        <p className={styles.success}>Account created — taking you to log in…</p>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label} htmlFor="su-name">Name</label>
          <input
            id="su-name"
            className={styles.input}
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <label className={styles.label} htmlFor="su-email">Username</label>
          <input
            id="su-email"
            className={styles.input}
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <label className={styles.label} htmlFor="su-pass">Password</label>
          <input
            id="su-pass"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <label className={styles.label} htmlFor="su-confirm">Confirm Password</label>
          <input
            id="su-confirm"
            className={styles.input}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit">Sign Up</button>
          <p className={styles.fine}>All your data is confidential.</p>
        </form>
      )}
    </main>
  );
}
