"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth-context";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await register(email, password, displayName);
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
      <h1 className={styles.title}>Create your account</h1>
      <p className={styles.subtitle}>Free to join. No credit card, no pay-to-win.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Display name</span>
          <input
            type="text"
            required
            maxLength={64}
            className={styles.input}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
          />
        </label>
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
            minLength={8}
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
