import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";

const ZONE_COLOR: Record<string, string> = {
  head: "#3987e5", // categorical slot 1 (blue)
  chest: "#d95926", // categorical slot 2 (orange)
  limb: "#199e70", // categorical slot 3 (aqua)
};

export default async function OperatorStatsPage({ params }: { params: { id: string } }) {
  const { token } = await requireSession();
  const stats = await api.getOperatorStats(token, params.id);
  const zoneEntries = Object.entries(stats.hitsByZone) as [string, number][];
  const maxZone = Math.max(1, ...zoneEntries.map(([, v]) => v));

  return (
    <main className="container">
      <h1>Operator stats</h1>

      <div className="grid grid-3">
        <div className="stat-tile">
          <div className="value">{stats.accuracyPct.toFixed(0)}%</div>
          <div className="label">Accuracy ({stats.shotCount} shots)</div>
        </div>
        <div className="stat-tile">
          <div className="value">
            {stats.avgReactionTimeMs != null ? `${Math.round(stats.avgReactionTimeMs)}ms` : "—"}
          </div>
          <div className="label">Avg reaction time</div>
        </div>
        <div className="stat-tile">
          <div className="value">
            {stats.avgSplitTimeMs != null ? `${Math.round(stats.avgSplitTimeMs)}ms` : "—"}
          </div>
          <div className="label">Avg split time</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2>Hits by zone</h2>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, height: 160, padding: "0 8px" }}>
            {zoneEntries.map(([zone, count]) => (
              <div key={zone} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{count}</div>
                <div
                  title={`${zone}: ${count} hit(s)`}
                  style={{
                    width: 48,
                    height: Math.max(4, (count / maxZone) * 120),
                    background: ZONE_COLOR[zone],
                    borderRadius: "4px 4px 2px 2px",
                  }}
                />
                <div style={{ fontSize: 12, color: "var(--text-dim)", textTransform: "capitalize" }}>
                  {zone}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Safety</h2>
          <div
            className="stat-tile"
            style={{
              borderColor: stats.hostageHitCount > 0 ? "#d03b3b" : "#262e29",
            }}
          >
            <div className="value" style={{ color: stats.hostageHitCount > 0 ? "#e66767" : "#0ca30c" }}>
              {stats.hostageHitCount}
            </div>
            <div className="label">Hostage / non-threat hits (all sessions)</div>
          </div>
          <p className="text-dim" style={{ marginTop: 12 }}>
            Across {stats.sessionCount} session(s).
          </p>
        </div>
      </div>
    </main>
  );
}
