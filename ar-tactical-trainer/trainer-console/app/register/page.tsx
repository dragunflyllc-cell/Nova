import Link from "next/link";
import { registerAction } from "./actions";

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <h1>Register your unit</h1>
      <p className="text-dim">
        Creates a new org and its first admin account. Every other trainer/operator gets added
        from the Operators page once you're signed in.
      </p>
      <div className="panel">
        <form action={registerAction}>
          <div className="form-row">
            <label htmlFor="orgName">Unit / department name</label>
            <input id="orgName" name="orgName" required autoFocus />
          </div>
          <div className="form-row">
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" required />
          </div>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password (min 8 characters)</label>
            <input id="password" name="password" type="password" minLength={8} required />
          </div>
          {searchParams.error && <p style={{ color: "var(--bad)" }}>{searchParams.error}</p>}
          <div className="form-actions">
            <button type="submit">Create account</button>
          </div>
        </form>
      </div>
      <p className="text-dim">
        Already registered? <Link href="/login">Sign in</Link>.
      </p>
    </main>
  );
}
