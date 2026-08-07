"""
Nova's Rithmic sidecar.

Rithmic's real wire protocol (R|Protocol API) is Google Protocol Buffers
over WebSocket — there is no working Node.js/TypeScript client for it
anywhere, and the message schema is only available through Rithmic's
developer dev-kit (requested directly from Rithmic, not public). Rather
than fabricate a protobuf implementation, this is a thin FastAPI wrapper
around `async_rithmic` (github.com/rundef/async_rithmic, MIT licensed,
PyPI), the real open-source Python client that already speaks that
protocol correctly. Nova's Node API talks to this over plain internal
HTTP — see apps/api/src/brokers/rithmic.ts.

VERIFIED against async_rithmic's own source (its docs site 403s
automated fetches the same way every other broker's docs have in this
project):
  - RithmicClient(user, password, system_name, app_name, app_version, url)
  - client.connect(plants=[SysInfraType.ORDER_PLANT])
  - client.list_accounts() -> list of protobuf message objects with an
    `.account_id` attribute (confirmed via the library's own internal use)
  - client.get_fill_history(start_time, end_time, account_id=...) -> list
    of protobuf message objects (same underlying `_send_and_collect`
    mechanism as list_accounts)
  - client.disconnect()

NOT VERIFIED — nothing here has been run against a real Rithmic login yet
(that requires Rithmic's developer dev-kit: an app_name/app_version they
issue you, plus a system_name + gateway URL for whichever environment
you're connecting to — their free Test system for development, or a real
broker's production system):
  - The exact field names on an account or fill object. Rather than guess,
    `_to_dict` below converts whatever protobuf message comes back using
    reflection (`MessageToDict`), so the real field names surface exactly
    as Rithmic defines them — Nova's Node-side parser
    (apps/api/src/brokers/rithmic.ts) is written defensively for the same
    reason `parseFill` is for Tradovate: it throws loudly with the raw
    payload attached on any mismatch, rather than silently guessing wrong.
"""

import os
from datetime import datetime

from fastapi import FastAPI, HTTPException
from google.protobuf.json_format import MessageToDict
from pydantic import BaseModel

from async_rithmic import RithmicClient, SysInfraType

app = FastAPI(title="Nova Rithmic Sidecar")

APP_NAME = os.environ.get("RITHMIC_APP_NAME", "")
APP_VERSION = os.environ.get("RITHMIC_APP_VERSION", "1.0")


class ConnectionInfo(BaseModel):
    username: str
    password: str
    systemName: str
    gateway: str


class FillsRequest(ConnectionInfo):
    accountId: str
    startTime: datetime
    endTime: datetime


def _to_dict(obj):
    """Reflection-based conversion — works regardless of the real field
    names, which aren't knowable until this runs against a live account."""
    if hasattr(obj, "DESCRIPTOR"):
        return MessageToDict(obj, preserving_proto_field_name=True, use_integers_for_enums=True)
    if isinstance(obj, dict):
        return obj
    return {"value": str(obj)}


async def _connected_client(info: ConnectionInfo) -> RithmicClient:
    if not APP_NAME:
        raise HTTPException(500, "RITHMIC_APP_NAME is not configured on this sidecar — see README.md.")
    client = RithmicClient(
        user=info.username,
        password=info.password,
        system_name=info.systemName,
        app_name=APP_NAME,
        app_version=APP_VERSION,
        url=info.gateway,
    )
    try:
        await client.connect(plants=[SysInfraType.ORDER_PLANT])
    except Exception as exc:  # noqa: BLE001 — surfaced to the caller as a clean 502, not a stack trace
        raise HTTPException(502, f"Rithmic connection failed: {exc}") from exc
    return client


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/accounts")
async def list_accounts(req: ConnectionInfo):
    client = await _connected_client(req)
    try:
        accounts = await client.list_accounts()
        return [_to_dict(a) for a in accounts]
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"Rithmic account listing failed: {exc}") from exc
    finally:
        await client.disconnect()


@app.post("/fills")
async def get_fills(req: FillsRequest):
    client = await _connected_client(req)
    try:
        fills = await client.get_fill_history(
            start_time=req.startTime,
            end_time=req.endTime,
            account_id=req.accountId,
        )
        return [_to_dict(f) for f in fills]
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"Rithmic fill history request failed: {exc}") from exc
    finally:
        await client.disconnect()
