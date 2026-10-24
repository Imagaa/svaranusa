import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";


export const metadata: Metadata = {
  title: 'Svaranusa',
  description: 'Pembelian Tiket Svaranusa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}