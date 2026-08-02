"use client";

import { useState, type FormEvent } from "react";
import { joinWaitlist } from "../lib/api";
import styles from "./WaitlistForm.module.css";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [propFirmCode, setPropFirmCode] = useState("");
  const [showCodeField, setShowCodeField] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await joinWaitlist(email, propFirmCode.trim() || undefined);
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
      <div className={styles.row}>
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
      </div>

      {showCodeField ? (
        <input
          type="text"
          placeholder="Prop firm code (optional)"
          value={propFirmCode}
          onChange={(event) => setPropFirmCode(event.target.value)}
          className={styles.codeInput}
          disabled={status === "loading"}
          aria-label="Prop firm code"
        />
      ) : (
        <button type="button" className={styles.codeToggle} onClick={() => setShowCodeField(true)}>
          Have a prop firm code?
        </button>
      )}

      {status === "error" ? <p className={styles.error}>{error}</p> : null}
    </form>
  );
}
