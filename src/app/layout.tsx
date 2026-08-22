import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { normalizeLanguage } from '@/lib/i18n';

export const metadata: Metadata = {
  title: {
    default: "GlobeTrotter — Make every day count",
    template: "%s · GlobeTrotter",
  },
  description:
    "Build multi-city itineraries, keep the budget honest, and share a trip worth taking.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const preference = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { language: true } }) : null;
  const language = normalizeLanguage(preference?.language ?? 'en');
  return (
    <html lang={language} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
