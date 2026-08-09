/**
 * v1 has no auth/multi-tenant UI yet (flagged in docs/ARCHITECTURE.md as
 * roadmap work); every page scopes to this single demo org so the console
 * is usable out of the box. Swap this for a real session-derived orgId
 * once auth lands.
 */
export const DEMO_ORG_ID = "org_demo";
