# Nova Rithmic Sidecar

A small internal FastAPI service that speaks Rithmic's real protocol
(Protocol Buffers over WebSocket) on Nova's behalf, using the open-source
[`async_rithmic`](https://github.com/rundef/async_rithmic) library. Nova's
main API (`apps/api`) is TypeScript/Node — there's no working Rithmic
client for that runtime, and the message schema isn't public, so this
exists specifically to avoid guessing at a proprietary wire protocol.

It is **not** a public-facing service — only `apps/api` should ever call
it, over an internal network / localhost.

## Before this can connect to anything real

You need Rithmic's developer dev-kit, requested directly from Rithmic (not
self-serve like ProjectX — email them with your name, company, contact
info, and which API flavor you need — R|Protocol API for this). They'll
give you:

- An `app_name` / `app_version` — identifies this application to Rithmic.
  Set these as `RITHMIC_APP_NAME` / `RITHMIC_APP_VERSION` below.
- Credentials for their free **Test** system (paper trading, real market
  data, no funded account needed) — good enough to develop and verify this
  sidecar end to end.
- Later, for real production data: a relationship with a Rithmic-cleared
  broker (e.g. AMP Futures, Ironbeam — any of them, not tied to any one
  company) for a live `system_name` + gateway URL, plus Rithmic's
  conformance review and ~$125/month in fees.

Individual end users connecting through Nova bring their own Rithmic
login (username + password) — same pattern as every other broker adapter
here, nothing Rithmic-specific for them to install.

## Running locally

```bash
cd services/rithmic-sidecar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export RITHMIC_APP_NAME="your-app-name-from-rithmic"
export RITHMIC_APP_VERSION="1.0"
uvicorn main:app --port 8100
```

`apps/api`'s `RITHMIC_SIDECAR_URL` env var should point at wherever this
ends up running (`http://localhost:8100` in dev).

## Endpoints

- `GET /health`
- `POST /accounts` — `{ username, password, systemName, gateway }` →
  list of accounts (raw, reflection-converted — see main.py header for why)
- `POST /fills` — same connection fields plus `{ accountId, startTime,
  endTime }` → list of fills (same raw/reflection shape)

Every call logs in fresh and disconnects when done, rather than holding a
persistent connection per user — simpler and more robust for an
on-demand "sync my fills" action than managing long-lived state.
