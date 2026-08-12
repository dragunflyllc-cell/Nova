import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getOptionalSession, AUTH_DISABLED } from "@/lib/session";
import { logoutAction } from "./login/actions";

export const metadata: Metadata = {
  title: "AR Tactical Trainer — Console",
  description: "Trainer console for the AR tactical training system",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSession();

  return (
    <html lang="en">
      <body>
        <nav>
          <span className="brand">TACTICAL AR // TRAINER CONSOLE</span>
          {session && (
            <>
              <Link href="/facilities">Facilities</Link>
              <Link href="/scenarios">Scenarios</Link>
              <Link href="/operators">Operators</Link>
              {AUTH_DISABLED ? (
                <span
                  className="badge"
                  style={{ marginLeft: "auto", background: "rgba(224,178,63,.15)", color: "var(--warn)" }}
                  title="No login required — set DISABLE_AUTH=false on the server to turn real accounts back on"
                >
                  DEV MODE — no login
                </span>
              ) : (
                <>
                  <span className="text-dim" style={{ marginLeft: "auto" }}>
                    {session.operator.name} · {session.operator.role}
                  </span>
                  <form action={logoutAction}>
                    <button type="submit" className="secondary">
                      Sign out
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </nav>
        {children}
      </body>
    </html>
  );
}
