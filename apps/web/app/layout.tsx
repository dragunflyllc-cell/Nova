import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Nova",
  description: "The AI trading operating system.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
