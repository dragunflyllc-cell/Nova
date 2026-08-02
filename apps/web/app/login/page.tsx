"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth-context";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.wordmark}>
        NOVA<span>DEX</span>
      </div>
      <h1 className={styles.title}>Log in</h1>
      <p className={styles.subtitle}>Welcome back to your trading crew.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            type="email"
            required
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            type="password"
            required
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className={styles.switch}>
        New to Nova? <Link href="/register">Create an account</Link>
      </p>
    </main>
  );
}
