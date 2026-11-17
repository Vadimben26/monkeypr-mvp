import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monkeypr — Prove where your money comes from",
  description:
    "Monkeypr helps young people check how a bank would see their income, fix the gaps, and generate a bank-ready source-of-funds statement.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
