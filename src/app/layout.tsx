import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TTG QA",
  description: "Real-time classroom Q&A app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
