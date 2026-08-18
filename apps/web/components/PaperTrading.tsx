"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import styles from "./TradingLog.module.css";

const SYMBOLS = ["ES", "MES", "NQ", "MNQ", "CL", "MCL", "GC", "MGC"];

interface Quote {
  symbol: string;
  price: number;
  asOf: string;
}

interface Position {
  symbol: string;
  direction: "long" | "short";
  quantity: number;
  entryPrice: number;
  openedAt: string;
}

interface CloseResult {
  symbol: string;
  direction: "long" | "short";
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pointsPnl: number;
}

export function PaperTrading() {
  const { apiFetch } = useAuth();
  const [position, setPosition] = useState<Position | null | undefined>(undefined);
  const [form, setForm] = useState({ symbol: "MES", direction: "long", quantity: "1" });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<CloseResult | null>(null);
  const [error, setError] = useState("");

  const loadPosition = useCallback(async () => {
    const res = await apiFetch("/me/paper/position");
    if (res.ok) setPosition(await res.json());
  }, [apiFetch]);

  useEffect(() => {
    loadPosition();
  }, [loadPosition]);

  async function handleQuote(symbol: string) {
    setError("");
    setQuoting(true);
    setQuote(null);
    try {
      const res = await apiFetch(`/me/paper/quote?symbol=${symbol}`);
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Couldn't fetch a quote.");
      setQuote(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setQuoting(false);
    }
  }

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOpening(true);
    setCloseResult(null);
    try {
      const res = await apiFetch("/me/paper/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: form.symbol, direction: form.direction, quantity: Number(form.quantity) }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Couldn't open that position.");
      setPosition(body);
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOpening(false);
    }
  }

  async function handleClose() {
    setError("");
    setClosing(true);
    try {
      const res = await apiFetch("/me/paper/close", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Couldn't close that position.");
      setCloseResult(body);
      setPosition(null);
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className={styles.card} style={{ marginBottom: 24 }}>
      <h3 className={styles.cardTitle}>Paper trading</h3>
      <p className={styles.cardSub}>
        Trade against real (delayed) market prices — no broker needed. Nova generates the fill itself, so there's
        nothing to fake: every trade traces back to a price Nova actually fetched.
      </p>

      {error ? <p style={{ color: "var(--loss)", fontSize: "0.8125rem", marginTop: 8 }}>{error}</p> : null}

      {position === undefined ? (
        <p className={styles.emptyLine}>Loading…</p>
      ) : position ? (
        <div className={styles.syncResult}>
          <p>
            Open <strong>{position.direction}</strong> {position.quantity} {position.symbol} @ {position.entryPrice}
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className={styles.submitBtn} onClick={() => handleQuote(position.symbol)} disabled={quoting}>
              {quoting ? "Checking…" : "Check current price"}
            </button>
            <button type="button" className={styles.syncBtn} onClick={handleClose} disabled={closing}>
              {closing ? "Closing…" : "Close position"}
            </button>
          </div>
          {quote ? (
            <p style={{ marginTop: 8 }}>
              {quote.symbol} @ {quote.price} <span className={styles.listRowMeta}>(as of {new Date(quote.asOf).toLocaleTimeString()})</span>
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <form className={styles.form} onSubmit={handleOpen}>
            <div className={styles.field}>
              <label htmlFor="paperSymbol">Symbol</label>
              <select id="paperSymbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="paperDirection">Direction</label>
              <select
                id="paperDirection"
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value })}
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="paperQty">Qty</label>
              <input
                id="paperQty"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
            <button type="button" className={styles.submitBtn} onClick={() => handleQuote(form.symbol)} disabled={quoting}>
              {quoting ? "Checking…" : "Get quote"}
            </button>
            <button type="submit" className={styles.syncBtn} disabled={opening}>
              {opening ? "Opening…" : "Open position"}
            </button>
          </form>

          {quote ? (
            <p style={{ marginTop: 8 }}>
              {quote.symbol} @ {quote.price} <span className={styles.listRowMeta}>(as of {new Date(quote.asOf).toLocaleTimeString()})</span>
            </p>
          ) : null}

          {closeResult ? (
            <div className={styles.syncResult} style={{ marginTop: 12 }}>
              <p>
                Closed <strong>{closeResult.direction}</strong> {closeResult.quantity} {closeResult.symbol}: entered{" "}
                {closeResult.entryPrice}, exited {closeResult.exitPrice}
              </p>
              <p style={{ color: closeResult.pointsPnl >= 0 ? "var(--gain)" : "var(--loss)" }}>
                {closeResult.pointsPnl >= 0 ? "+" : ""}
                {closeResult.pointsPnl.toFixed(2)} points
              </p>
              <p className={styles.emptyLine}>Hit "Sync my trading behavior" below to apply XP from this trade.</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
