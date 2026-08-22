import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GlobeTrotter — Make every day count",
    template: "%s · GlobeTrotter",
  },
  description:
    "Build multi-city itineraries, keep the budget honest, and share a trip worth taking.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
