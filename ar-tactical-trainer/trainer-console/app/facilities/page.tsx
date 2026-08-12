import Link from "next/link";
import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { createFacilityAction } from "./actions";

export default async function FacilitiesPage() {
  const { token } = await requireSession();
  const facilities = await api.listFacilities(token);

  return (
    <main className="container">
      <h1>Facilities</h1>
      <p className="text-dim">
        A facility is a physical building/site that's been AR-scanned by an operator
        (`Scanning/FacilityScanner.cs`). Scenarios can anchor targets to a facility's scan so
        placements persist across sessions in the same building — or skip this for open-ground
        drills.
      </p>

      <div className="panel">
        <h2>Add facility</h2>
        <form action={createFacilityAction}>
          <div className="form-row">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" placeholder="e.g. Shoothouse A — Building 12" required />
          </div>
          <div className="form-actions">
            <button type="submit">Add</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Registered facilities</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{new Date(f.createdAt).toLocaleString()}</td>
                <td>
                  <Link href={`/facilities/${f.id}`}>View</Link>
                </td>
              </tr>
            ))}
            {facilities.length === 0 && (
              <tr>
                <td colSpan={3} className="text-dim">
                  No facilities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
