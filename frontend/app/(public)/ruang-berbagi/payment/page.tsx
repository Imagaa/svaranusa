'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const POLL_INTERVAL_MS = 4000;

function DonationPaymentContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();

  const donationCode  = searchParams.get('donation_code') || '';
  const nama          = searchParams.get('nama') || '';
  const email         = searchParams.get('email') || '';
  const amount        = Number(searchParams.get('amount') || 0);

  const [qrisUrl, setQrisUrl]         = useState<string | null>(null);
  const [qrisError, setQrisError]     = useState('');
  const [loadingQris, setLoadingQris] = useState(true);
  const [polling, setPolling]         = useState(false);
  const pollRef                       = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch QRIS
  useEffect(() => {
    if (!donationCode) return;
    fetch(`${API_URL}/donations/${donationCode}/qris`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.qris_url) setQrisUrl(data.qris_url);
        else setQrisError(data.message ?? 'Gagal memuat QRIS.');
        setLoadingQris(false);
      })
      .catch(() => { setQrisError('Gagal menghubungi server.'); setLoadingQris(false); });
  }, [donationCode]);

  // Auto-start polling setelah QRIS dimuat
  useEffect(() => {
    if (qrisUrl && !polling) startPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrisUrl]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = () => {
    if (polling || !donationCode) return;
    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_URL}/donations/${donationCode}`);
        const data = await res.json();
        if (data.status === 'paid') {
          clearInterval(pollRef.current!);
          router.push(
            `/ruang-berbagi/sukses?donation_code=${donationCode}&nama=${encodeURIComponent(nama)}&email=${encodeURIComponent(email)}&amount=${amount}`
          );
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          clearInterval(pollRef.current!);
          setQrisError('Donasi sudah tidak aktif. Silakan ulangi.');
          setPolling(false);
        }
      } catch { /* abaikan error network sementara */ }
    }, POLL_INTERVAL_MS);
  };

  return (
    <div className="min-h-screen bg-svara-black">
      <div className="border-b border-svara-white/10 px-6 py-4 sticky top-0 bg-svara-black z-10 flex justify-between items-center">
        <Link href="/" className="font-display text-lg text-svara-green tracking-widest">SVARANUSA</Link>
        <span className="text-svara-orange/60 text-xs tracking-widest uppercase">Ruang Berbagi</span>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <h1 className="font-display text-3xl text-svara-white mb-2">Pembayaran Donasi</h1>
        <p className="text-svara-white/40 text-sm mb-2">Scan QR menggunakan e-wallet atau mobile banking</p>
        <p className="text-svara-orange font-semibold mb-10">
          Rp {amount.toLocaleString('id-ID')}
        </p>

        {/* QRIS */}
        <div className="mb-8 flex justify-center">
          {loadingQris && (
            <div className="border border-svara-white/10 p-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-svara-white/20 border-t-svara-orange rounded-full animate-spin" />
              <p className="text-svara-white/30 text-sm">Memuat QRIS...</p>
            </div>
          )}
          {!loadingQris && qrisError && (
            <div className="border border-red-500/30 bg-red-500/10 p-8 text-center">
              <p className="text-red-400 text-sm mb-4">{qrisError}</p>
              <Link href="/ruang-berbagi" className="text-svara-orange text-sm underline">Ulangi donasi</Link>
            </div>
          )}
          {!loadingQris && qrisUrl && (
            <div className="border border-svara-white/10 p-6 bg-white inline-block">
              <Image src={qrisUrl} alt="QRIS Donasi" width={220} height={220} unoptimized />
              <p className="text-svara-black/50 text-xs mt-3 font-mono">{donationCode}</p>
            </div>
          )}
        </div>

        <div className="border border-svara-white/10 p-5 mb-8 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Nama</span>
            <span className="text-svara-white">{nama}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Email</span>
            <span className="text-svara-white">{email}</span>
          </div>
          <div className="border-t border-svara-white/10 pt-3 flex justify-between">
            <span className="text-svara-white font-semibold">Total Donasi</span>
            <span className="text-svara-orange font-bold text-xl">Rp {amount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <p className="text-svara-white/30 text-xs mb-6">
          QR otomatis terdeteksi setelah pembayaran. Klik tombol di bawah jika tidak otomatis.
        </p>

        <button
          onClick={startPolling}
          disabled={polling || loadingQris || !!qrisError}
          className="w-full bg-svara-orange text-svara-black py-4 font-semibold tracking-widest uppercase text-sm hover:bg-svara-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {polling
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-svara-black/30 border-t-svara-black rounded-full animate-spin" />
                Mengecek pembayaran...
              </span>
            : 'Saya Sudah Berdonasi'
          }
        </button>
      </div>
    </div>
  );
}

export default function DonationPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-svara-black flex items-center justify-center text-svara-white/40">Memuat...</div>}>
      <DonationPaymentContent />
    </Suspense>
  );
}
