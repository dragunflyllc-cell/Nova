import type { ReactNode } from "react";

export const metadata = {
  title: "Nova",
  description: "The AI trading operating system.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
