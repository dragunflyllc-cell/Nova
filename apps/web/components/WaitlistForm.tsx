"use client";

import { useState, type FormEvent } from "react";
import { joinWaitlist } from "../lib/api";
import styles from "./WaitlistForm.module.css";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await joinWaitlist(email);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return <p className={styles.success}>You&rsquo;re on the list. We&rsquo;ll email you when Nova opens up.</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={styles.input}
        disabled={status === "loading"}
        aria-label="Email address"
      />
      <button type="submit" className={styles.button} disabled={status === "loading"}>
        {status === "loading" ? "Joining…" : "Join the Waitlist"}
      </button>
      {status === "error" ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
}
