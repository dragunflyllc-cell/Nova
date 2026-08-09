import Link from "next/link";
import { loginAction } from "./actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1>Sign in</h1>
      <div className="panel">
        <form action={loginAction}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoFocus />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required />
          </div>
          {searchParams.error && <p style={{ color: "var(--bad)" }}>{searchParams.error}</p>}
          <div className="form-actions">
            <button type="submit">Sign in</button>
          </div>
        </form>
      </div>
      <p className="text-dim">
        No org yet? <Link href="/register">Register your unit</Link>.
      </p>
    </main>
  );
}
