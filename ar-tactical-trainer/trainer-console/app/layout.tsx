import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getOptionalSession } from "@/lib/session";
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
        </nav>
        {children}
      </body>
    </html>
  );
}
