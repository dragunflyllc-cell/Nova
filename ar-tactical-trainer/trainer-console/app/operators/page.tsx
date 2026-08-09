import Link from "next/link";
import { api } from "@/lib/api";
import { DEMO_ORG_ID } from "@/lib/org";
import { createOperatorAction } from "./actions";

export default async function OperatorsPage() {
  const operators = await api.listOperators(DEMO_ORG_ID);

  return (
    <main className="container">
      <h1>Operators</h1>

      <div className="panel">
        <h2>Register operator or trainer</h2>
        <form action={createOperatorAction}>
          <div className="grid grid-3">
            <div className="form-row">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required />
            </div>
            <div className="form-row">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="form-row">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" defaultValue="operator">
                <option value="operator">Operator</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Register</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h2>Roster</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Registered</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {operators.map((op) => (
              <tr key={op.id}>
                <td>{op.name}</td>
                <td>{op.email}</td>
                <td>{op.role}</td>
                <td>{new Date(op.createdAt).toLocaleString()}</td>
                <td>
                  {op.role === "operator" && (
                    <Link href={`/operators/${op.id}/stats`}>Stats</Link>
                  )}
                </td>
              </tr>
            ))}
            {operators.length === 0 && (
              <tr>
                <td colSpan={5} className="text-dim">
                  No operators registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
