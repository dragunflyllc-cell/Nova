"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CharacterCard.module.css";
import { tickerFor } from "../lib/ticker";

/**
 * Real character artwork drops in at /public/characters/<stageId>.png — no
 * code change needed, this just tries that path and falls back to a tasteful
 * placeholder (ticker glyph on the rarity color) if the file doesn't exist
 * yet. Every stage renders the placeholder today, since no art exists yet.
 *
 * The mount-time check below matters: with server-rendered HTML, the browser
 * starts loading <img> resources before React hydrates, so a fast 404 can
 * fail before onError has anything attached to catch it. The useEffect check
 * (img.complete + naturalWidth === 0) catches that case; onError covers a
 * slower failure that happens after hydration.
 */
export function CharacterPortrait({ stageId, name }: { stageId: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
    return (
      <div className={styles.portraitFallback}>
        <span>${tickerFor(name)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local /public asset with a runtime existence check via onError
    <img
      ref={imgRef}
      src={`/characters/${stageId}.png`}
      alt={name}
      className={styles.portrait}
      onError={() => setFailed(true)}
    />
  );
}
