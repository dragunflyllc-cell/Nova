"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { characterStageById } from "@nova/nova-dex";
import { CharacterCard } from "../../components/CharacterCard";
import { TradingLog } from "../../components/TradingLog";
import { useAuth } from "../../lib/auth-context";
import type { OwnedCharacter } from "../../lib/api";
import styles from "./page.module.css";

const STARTER_FAMILY_IDS = ["monkey-line", "panda-line", "hippo-line", "fox-line"];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, apiFetch, logout } = useAuth();
  const [owned, setOwned] = useState<OwnedCharacter[] | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadCharacters = useCallback(async () => {
    const res = await apiFetch("/me/characters");
    if (res.ok) {
      setOwned(await res.json());
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      loadCharacters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleClaim(familyId: string) {
    setClaiming(familyId);
    setError("");
    try {
      const res = await apiFetch("/me/characters/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Couldn't claim that character.");
      }
      await loadCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setClaiming(null);
    }
  }

  if (loading || !user) {
    return (
      <main className={styles.page}>
        <p className={styles.loadingLine}>Loading…</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.wordmark}>
          NOVA<span>DEX</span>
        </div>
        <button type="button" className={styles.claimButton} style={{ width: "auto" }} onClick={() => logout()}>
          Log out
        </button>
      </div>
      <p className={styles.greeting}>
        Welcome back, <strong>{user.displayName}</strong>.
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      {owned === null ? (
        <p className={styles.loadingLine}>Loading your crew…</p>
      ) : owned.length === 0 ? (
        <section>
          <h2 className={styles.sectionTitle}>Choose your starter</h2>
          <p className={styles.sectionSub}>
            Every trader starts somewhere. Pick the one that feels most like you today — the rest of the NovaDex
            unlocks as your real trading behavior reveals itself.
          </p>
          <div className={styles.starterGrid}>
            {STARTER_FAMILY_IDS.map((familyId) => {
              const stageId = STARTER_STAGE_FOR_FAMILY[familyId];
              const stage = stageId ? characterStageById[stageId] : undefined;
              if (!stage) return null;
              return (
                <div className={styles.starterOption} key={familyId}>
                  <CharacterCard stage={stage} />
                  <button
                    type="button"
                    className={styles.claimButton}
                    disabled={claiming !== null}
                    onClick={() => handleClaim(familyId)}
                  >
                    {claiming === familyId ? "Claiming…" : `Choose ${stage.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section>
          <h2 className={styles.sectionTitle}>My trading crew</h2>
          <p className={styles.sectionSub}>
            {owned.length} character{owned.length === 1 ? "" : "s"} captured. Evolves as you level up.
          </p>
          <div className={styles.crewGrid}>
            {owned.map((oc) => (
              <CharacterCard key={oc.id} stage={oc.stage} level={oc.level} xp={oc.xp} />
            ))}
          </div>

          <TradingLog />
        </section>
      )}
    </main>
  );
}

const STARTER_STAGE_FOR_FAMILY: Record<string, string> = {
  "monkey-line": "fomo-monkey",
  "panda-line": "patient-panda",
  "hippo-line": "hodl-hippo",
  "fox-line": "fearful-fox",
};
