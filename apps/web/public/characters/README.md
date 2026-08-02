# Character art

Drop artwork here named to match a stage's id from `packages/nova-dex` —
e.g. `fomo-monkey.png` for the FOMO Monkey card. No code change needed:
`components/CharacterPortrait.tsx` tries `/characters/<stageId>.png` for
every card and falls back to a placeholder if the file doesn't exist.

Recommended: ~4:3 aspect ratio (matches the card's portrait area), PNG or
JPG, reasonably compressed for the web.

Stage ids live in `packages/nova-dex/src/characters.ts` — search for `id:`.
