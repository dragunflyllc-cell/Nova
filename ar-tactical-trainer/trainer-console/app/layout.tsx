import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR Tactical Trainer — Console",
  description: "Trainer console for the AR tactical training system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <span className="brand">TACTICAL AR // TRAINER CONSOLE</span>
          <Link href="/facilities">Facilities</Link>
          <Link href="/scenarios">Scenarios</Link>
          <Link href="/operators">Operators</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
