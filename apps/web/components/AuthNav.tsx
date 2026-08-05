"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";
import styles from "./AuthNav.module.css";

export function AuthNav() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className={styles.nav}>
      <Link href="/learn" className={styles.link}>
        Learn
      </Link>
      <Link href="/novadex" className={styles.link}>
        Browse the NovaDex
      </Link>
      {loading ? null : user ? (
        <>
          <Link href="/dashboard" className={`${styles.link} ${styles.linkPrimary}`}>
            Dashboard
          </Link>
          <button type="button" className={styles.link} onClick={() => logout()}>
            Log out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={styles.link}>
            Log in
          </Link>
          <Link href="/register" className={`${styles.link} ${styles.linkPrimary}`}>
            Sign up
          </Link>
        </>
      )}
    </nav>
  );
}
