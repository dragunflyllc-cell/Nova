import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";

export default async function FacilityDetailPage({ params }: { params: { id: string } }) {
  const { token } = await requireSession();
  const facility = await api.getFacility(token, params.id);

  return (
    <main className="container">
      <h1>{facility.name}</h1>
      <p className="text-dim">Added {new Date(facility.createdAt).toLocaleString()}</p>

      <div className="panel">
        <h2>Scan layouts</h2>
        <p className="text-dim">
          Captured on-device via the operator app's facility scan (AR Foundation mesh, or the
          RoomPlan bridge on LiDAR iOS devices — see docs/ARCHITECTURE.md). Each layout's named
          anchors are what a scenario's target placements can reference so targets stay put across
          sessions in this building.
        </p>
        <table>
          <thead>
            <tr>
              <th>Captured</th>
              <th>Mesh asset</th>
              <th>Anchors</th>
            </tr>
          </thead>
          <tbody>
            {facility.scanLayouts.map((layout) => (
              <tr key={layout.id}>
                <td>{new Date(layout.capturedAt).toLocaleString()}</td>
                <td>{layout.meshAssetUrl}</td>
                <td>{layout.anchors.map((a) => a.label).join(", ") || "—"}</td>
              </tr>
            ))}
            {facility.scanLayouts.length === 0 && (
              <tr>
                <td colSpan={3} className="text-dim">
                  No scan captured yet for this facility.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
