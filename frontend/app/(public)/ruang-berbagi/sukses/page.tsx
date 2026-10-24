'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function DonationSuksesContent() {
  const searchParams = useSearchParams();
  const nama         = searchParams.get('nama') || '';
  const email        = searchParams.get('email') || '';
  const amount       = Number(searchParams.get('amount') || 0);
  const code         = searchParams.get('donation_code') || '';

  return (
    <div className="min-h-screen bg-svara-black flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-svara-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-svara-orange text-3xl">♥</span>
        </div>
        <h1 className="font-display text-4xl text-svara-white mb-2">Terima Kasih!</h1>
        <p className="text-svara-white/40 text-sm mb-10">
          Dukungan Anda untuk Svaranusa telah kami terima dengan penuh rasa syukur.
        </p>

        <div className="border border-svara-white/10 p-6 mb-8 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Kode Donasi</span>
            <span className="text-svara-white font-mono text-xs">{code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Nama</span>
            <span className="text-svara-white">{nama}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Email</span>
            <span className="text-svara-white">{email}</span>
          </div>
          <div className="border-t border-svara-white/10 pt-3 flex justify-between">
            <span className="text-svara-white/50">Total Donasi</span>
            <span className="text-svara-orange font-semibold">Rp {amount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <Link
          href="/"
          className="block w-full bg-svara-orange text-svara-black py-4 font-semibold tracking-widest uppercase text-sm hover:bg-svara-orange/90 transition-colors text-center"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default function DonationSuksesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-svara-black flex items-center justify-center text-svara-white/40">Memuat...</div>}>
      <DonationSuksesContent />
    </Suspense>
  );
}
