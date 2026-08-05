"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import styles from "./TradingLog.module.css";

interface Fill {
  id: string;
  contractSymbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  filledAt: string;
}

type RuleType =
  | "MAX_TRADES_PER_DAY"
  | "MIN_COOLDOWN_AFTER_LOSS_MINUTES"
  | "MAX_POSITION_SIZE"
  | "MAX_DAILY_LOSS_POINTS"
  | "TRADING_HOURS_WINDOW_UTC";

interface Rule {
  id: string;
  type: RuleType;
  params: Record<string, number>;
  active: boolean;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  unlockFamilyName?: string;
  completed: boolean;
}

interface SyncResult {
  unlockedFamilies: { familyId: string; familyName: string; reason: string }[];
  completedQuests: { id: string; title: string; xpReward: number }[];
  accountXp: number;
  accountLevel: number;
  xpFromBehavior?: number;
}

const RULE_TYPE_LABEL: Record<RuleType, string> = {
  MAX_TRADES_PER_DAY: "Max trades per day",
  MIN_COOLDOWN_AFTER_LOSS_MINUTES: "Minimum cooldown after a loss (minutes)",
  MAX_POSITION_SIZE: "Max position size",
  MAX_DAILY_LOSS_POINTS: "Max daily loss (points)",
  TRADING_HOURS_WINDOW_UTC: "Trading hours window (UTC)",
};

function ruleSummary(rule: Rule): string {
  switch (rule.type) {
    case "MAX_TRADES_PER_DAY":
      return `Max ${rule.params.max} trades/day`;
    case "MIN_COOLDOWN_AFTER_LOSS_MINUTES":
      return `Wait ${rule.params.minutes} min after a loss`;
    case "MAX_POSITION_SIZE":
      return `Max size ${rule.params.maxQuantity}`;
    case "MAX_DAILY_LOSS_POINTS":
      return `Max ${rule.params.maxLossPoints}pt daily loss`;
    case "TRADING_HOURS_WINDOW_UTC":
      return `${rule.params.startHourUtc}:00–${rule.params.endHourUtc}:00 UTC`;
  }
}

export function TradingLog() {
  const { apiFetch } = useAuth();
  const [fills, setFills] = useState<Fill[] | null>(null);
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const [fillForm, setFillForm] = useState({ contractSymbol: "", side: "buy", quantity: "1", price: "", filledAt: "" });
  const [addingFill, setAddingFill] = useState(false);

  const [ruleType, setRuleType] = useState<RuleType>("MAX_TRADES_PER_DAY");
  const [ruleParam, setRuleParam] = useState({ a: "3", b: "16" });
  const [addingRule, setAddingRule] = useState(false);

  const load = useCallback(async () => {
    const [fillsRes, rulesRes, questsRes] = await Promise.all([
      apiFetch("/me/fills"),
      apiFetch("/me/rules"),
      apiFetch("/me/quests"),
    ]);
    if (fillsRes.ok) setFills(await fillsRes.json());
    if (rulesRes.ok) setRules(await rulesRes.json());
    if (questsRes.ok) setQuests(await questsRes.json());
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddFill(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAddingFill(true);
    try {
      const filledAt = fillForm.filledAt ? new Date(fillForm.filledAt).toISOString() : new Date().toISOString();
      const res = await apiFetch("/me/fills/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractSymbol: fillForm.contractSymbol,
          side: fillForm.side,
          quantity: Number(fillForm.quantity),
          price: Number(fillForm.price),
          filledAt,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.issues?.[0]?.message ?? body?.error ?? "Couldn't add that fill.");
      }
      setFillForm({ contractSymbol: "", side: "buy", quantity: "1", price: "", filledAt: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAddingFill(false);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAddingRule(true);
    try {
      let params: Record<string, number>;
      switch (ruleType) {
        case "MAX_TRADES_PER_DAY":
          params = { max: Number(ruleParam.a) };
          break;
        case "MIN_COOLDOWN_AFTER_LOSS_MINUTES":
          params = { minutes: Number(ruleParam.a) };
          break;
        case "MAX_POSITION_SIZE":
          params = { maxQuantity: Number(ruleParam.a) };
          break;
        case "MAX_DAILY_LOSS_POINTS":
          params = { maxLossPoints: Number(ruleParam.a) };
          break;
        case "TRADING_HOURS_WINDOW_UTC":
          params = { startHourUtc: Number(ruleParam.a), endHourUtc: Number(ruleParam.b) };
          break;
      }
      const res = await apiFetch("/me/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: ruleType, params }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.issues?.[0]?.message ?? body?.error ?? "Couldn't create that rule.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAddingRule(false);
    }
  }

  async function handleRemoveRule(id: string) {
    await apiFetch(`/me/rules/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleSync() {
    setError("");
    setSyncing(true);
    setSyncResult(null);
    try {
      const xpRes = await apiFetch("/me/characters/sync-xp", { method: "POST" });
      const xpBody = xpRes.ok ? await xpRes.json() : null;

      await apiFetch("/me/rules/check", { method: "POST" });

      const progRes = await apiFetch("/me/progression/sync", { method: "POST" });
      if (!progRes.ok) {
        const body = await progRes.json().catch(() => null);
        throw new Error(body?.error ?? "Sync failed.");
      }
      const progBody: SyncResult = await progRes.json();
      setSyncResult({ ...progBody, xpFromBehavior: xpBody?.xpFromBehavior });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.cardTitle} style={{ fontSize: "1.375rem", marginBottom: 8 }}>
        Trading log &amp; accountability
      </h2>
      <p className={styles.cardSub} style={{ marginBottom: 24 }}>
        Log your real fills (or paste them in from a broker statement), set rules you want held to, and sync — your
        characters level up and new ones unlock based on what your trades actually show.
      </p>

      {error ? <p style={{ color: "var(--loss)", fontSize: "0.8125rem" }}>{error}</p> : null}

      <div className={styles.panelGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Log a fill</h3>
          <p className={styles.cardSub}>One row per execution — an entry and an exit make a closed trade.</p>
          <form className={styles.form} onSubmit={handleAddFill}>
            <div className={styles.field}>
              <label htmlFor="symbol">Symbol</label>
              <input
                id="symbol"
                placeholder="MESZ6"
                value={fillForm.contractSymbol}
                onChange={(e) => setFillForm({ ...fillForm, contractSymbol: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="side">Side</label>
              <select id="side" value={fillForm.side} onChange={(e) => setFillForm({ ...fillForm, side: e.target.value })}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="qty">Qty</label>
              <input
                id="qty"
                type="number"
                min="1"
                value={fillForm.quantity}
                onChange={(e) => setFillForm({ ...fillForm, quantity: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                step="any"
                value={fillForm.price}
                onChange={(e) => setFillForm({ ...fillForm, price: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="time">Time</label>
              <input
                id="time"
                type="datetime-local"
                value={fillForm.filledAt}
                onChange={(e) => setFillForm({ ...fillForm, filledAt: e.target.value })}
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={addingFill}>
              {addingFill ? "Adding…" : "Add fill"}
            </button>
          </form>

          <div className={styles.list}>
            {fills === null ? (
              <p className={styles.emptyLine}>Loading…</p>
            ) : fills.length === 0 ? (
              <p className={styles.emptyLine}>No fills logged yet.</p>
            ) : (
              fills.slice(0, 8).map((f) => (
                <div className={styles.listRow} key={f.id}>
                  <div className={styles.listRowMain}>
                    <span className={styles.listRowLabel}>
                      {f.side === "buy" ? "Bought" : "Sold"} {f.quantity} {f.contractSymbol} @ {f.price}
                    </span>
                    <span className={styles.listRowMeta}>{new Date(f.filledAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Your rules</h3>
          <p className={styles.cardSub}>Rules Nova checks against your real fills — not just intentions.</p>
          <form className={styles.form} onSubmit={handleAddRule}>
            <div className={styles.field} style={{ flexBasis: "220px" }}>
              <label htmlFor="ruleType">Rule</label>
              <select id="ruleType" value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)}>
                {Object.entries(RULE_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="paramA">{ruleType === "TRADING_HOURS_WINDOW_UTC" ? "Start hr" : "Value"}</label>
              <input
                id="paramA"
                type="number"
                value={ruleParam.a}
                onChange={(e) => setRuleParam({ ...ruleParam, a: e.target.value })}
                required
              />
            </div>
            {ruleType === "TRADING_HOURS_WINDOW_UTC" ? (
              <div className={styles.field}>
                <label htmlFor="paramB">End hr</label>
                <input
                  id="paramB"
                  type="number"
                  value={ruleParam.b}
                  onChange={(e) => setRuleParam({ ...ruleParam, b: e.target.value })}
                  required
                />
              </div>
            ) : null}
            <button type="submit" className={styles.submitBtn} disabled={addingRule}>
              {addingRule ? "Adding…" : "Add rule"}
            </button>
          </form>

          <div className={styles.list}>
            {rules === null ? (
              <p className={styles.emptyLine}>Loading…</p>
            ) : rules.length === 0 ? (
              <p className={styles.emptyLine}>No rules yet — add one above.</p>
            ) : (
              rules.map((r) => (
                <div className={styles.listRow} key={r.id}>
                  <div className={styles.listRowMain}>
                    <span className={styles.listRowLabel}>{ruleSummary(r)}</span>
                    <span className={styles.listRowMeta}>{RULE_TYPE_LABEL[r.type]}</span>
                  </div>
                  <button type="button" className={styles.removeBtn} onClick={() => handleRemoveRule(r.id)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 24 }}>
        <h3 className={styles.cardTitle}>Quests</h3>
        <div className={styles.list}>
          {quests === null ? (
            <p className={styles.emptyLine}>Loading…</p>
          ) : (
            quests.map((q) => (
              <div className={styles.listRow} key={q.id}>
                <div className={styles.listRowMain}>
                  <span className={styles.listRowLabel}>{q.title}</span>
                  <span className={styles.listRowMeta}>
                    {q.description} · +{q.xpReward} XP{q.unlockFamilyName ? ` · unlocks ${q.unlockFamilyName}` : ""}
                  </span>
                </div>
                <span className={`${styles.badge} ${q.completed ? styles.badgeDone : styles.badgePending}`}>
                  {q.completed ? "Done" : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button type="button" className={styles.syncBtn} onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing…" : "Sync my trading behavior"}
        </button>

        {syncResult ? (
          <div className={styles.syncResult}>
            {syncResult.xpFromBehavior !== undefined ? <p>Character XP from behavior: {syncResult.xpFromBehavior}</p> : null}
            <p>
              Account level {syncResult.accountLevel} ({syncResult.accountXp} XP)
            </p>
            {syncResult.unlockedFamilies.length > 0 ? (
              <p>
                <strong>New character{syncResult.unlockedFamilies.length > 1 ? "s" : ""} unlocked:</strong>{" "}
                {syncResult.unlockedFamilies.map((u) => u.familyName).join(", ")}
              </p>
            ) : null}
            {syncResult.completedQuests.length > 0 ? (
              <p>
                <strong>Quest{syncResult.completedQuests.length > 1 ? "s" : ""} completed:</strong>{" "}
                {syncResult.completedQuests.map((q) => q.title).join(", ")}
              </p>
            ) : null}
            {syncResult.unlockedFamilies.length === 0 && syncResult.completedQuests.length === 0 ? (
              <p className={styles.emptyLine}>No new unlocks this time — keep logging trades.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
