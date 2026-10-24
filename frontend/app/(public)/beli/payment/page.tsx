'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
// 1. Import Zustand Store kita
import { useCheckoutStore } from '@/lib/checkoutStore';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const POLL_INTERVAL_MS = 4000;

function PaymentContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  // 2. Panggil data customer dan fungsi pembersih dari Zustand
  const { customer, clearCheckout } = useCheckoutStore();

  const orderCode    = searchParams.get('order_code') || '';
  const seats        = (searchParams.get('seats') || '').split(',').filter(Boolean);
  const totalHarga   = Number(searchParams.get('total_harga') || 0);
  const adminFee     = Number(searchParams.get('admin_fee') || 0);
  const grandTotal   = Number(searchParams.get('grand_total') || 0);
  const nominalBayar = Number(searchParams.get('nominal_bayar') || grandTotal);
  const expiresAt    = searchParams.get('expires_at') || '';

  // 3. Gunakan data dari Zustand. Jika kosong (misal karena error), ambil dari URL/Default
  const nama  = customer?.name || searchParams.get('nama') || 'Tamu';
  const email = customer?.email || searchParams.get('email') || '';

  const [qrisUrl, setQrisUrl]         = useState<string | null>(null);
  const [qrisError, setQrisError]     = useState('');
  const [loadingQris, setLoadingQris] = useState(true);
  const [countdown, setCountdown]     = useState('');
  const [polling, setPolling]         = useState(false);
  const pollRef                       = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // PENJAGA GAWANG: Mencegah useEffect menembak API Midtrans 2 kali
  const fetchedRef                    = useRef(false);

  // ── Fetch QRIS dari backend ────────────────────────────
  useEffect(() => {
    if (!orderCode) {
      setQrisError('Kode Pesanan tidak ditemukan.');
      setLoadingQris(false);
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch(`${API_URL}/payments/qris`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_code: orderCode }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.qris_url) {
          setQrisUrl(data.qris_url);
          setQrisError('');
        } else {
          setQrisError(data.message ?? 'Gagal memuat QRIS.');
        }
        setLoadingQris(false);
      })
      .catch(() => {
        setQrisError('Gagal menghubungi server.');
        setLoadingQris(false);
      });
  }, [orderCode]);

  // ── Countdown timer ────────────────────────────────────
  useEffect(() => {
    if (!expiresAt) return;
    const expDate = new Date(expiresAt);

    const tick = () => {
      const diff = expDate.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('00:00');
        router.replace('/beli');
        return;
      }
      const m = String(Math.floor(diff / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setCountdown(`${m}:${s}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, router]);

  // ── Polling status order ───────────────────────────────
  const startPolling = () => {
    if (polling || !orderCode) return;
    setPolling(true);

    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_URL}/orders/${orderCode}?t=${new Date().getTime()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await res.json();

        if (data.status === 'paid') {
          clearInterval(pollRef.current!);
          
          clearCheckout(); 
          localStorage.removeItem('svara_active_order_v2'); // HAPUS MEMORI ORDER

          const params = new URLSearchParams({
            order_code:  orderCode,
            seats:       seats.join(','),
            grand_total: grandTotal.toString(),
            nama,
            email,
          });
          router.push(`/beli/success?${params}`);
        } else if (data.status === 'expired' || data.status === 'cancelled') {
          clearInterval(pollRef.current!);
          setQrisError('Order sudah tidak aktif. Silakan pesan ulang.');
          setPolling(false);
        }
      } catch {
        // abaikan error network sementara, terus polling
      }
    }, POLL_INTERVAL_MS);
  };

  // ── Auto-start polling setelah QRIS berhasil dimuat ───
  useEffect(() => {
    if (qrisUrl && !polling) {
      startPolling();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrisUrl]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-svara-black">
      <div className="border-b border-svara-white/10 px-6 py-4 sticky top-0 bg-svara-black z-10 flex justify-between items-center">
        <Link href="/" className="font-display text-lg text-svara-green tracking-widest">SVARANUSA</Link>
        {countdown && (
          <span className="text-svara-orange font-mono text-sm bg-svara-orange/10 px-3 py-1 rounded">
            ⏱ {countdown}
          </span>
        )}
      </div>

      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <h1 className="font-display text-3xl text-svara-white mb-2">Pembayaran QRIS</h1>
        <p className="text-svara-white/40 text-sm mb-10">Scan QR menggunakan e-wallet atau mobile banking</p>

        {/* QRIS Display */}
        <div className="mb-6 flex flex-col items-center">
          {loadingQris && (
            <div className="border border-svara-white/10 p-16 flex flex-col items-center gap-3 w-full max-w-[300px]">
              <div className="w-8 h-8 border-2 border-svara-white/20 border-t-svara-green rounded-full animate-spin" />
              <p className="text-svara-white/30 text-sm">Memuat QRIS...</p>
            </div>
          )}

          {!loadingQris && qrisError && (
            <div className="border border-red-500/30 bg-red-500/10 p-8 text-center rounded-lg w-full">
              <p className="text-red-400 text-sm mb-4 font-medium">{qrisError}</p>
              <Link href="/beli" className="bg-svara-green text-svara-black px-6 py-2 rounded-md text-sm font-bold uppercase tracking-widest hover:bg-svara-green/90 transition-colors">
                Kembali
              </Link>
            </div>
          )}

          {!loadingQris && !qrisError && qrisUrl && (
            <div className="border border-svara-white/10 p-6 bg-white inline-block rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] w-full max-w-[320px]">
              <Image
                src={qrisUrl}
                alt="QRIS Midtrans"
                width={250}
                height={250}
                unoptimized
                className="mx-auto"
              />
              <p className="text-svara-black/50 text-xs mt-4 font-mono font-bold tracking-widest">{orderCode}</p>
            </div>
          )}
        </div>

        {/* Ringkasan */}
        <div className="border border-svara-white/10 rounded-xl p-6 mb-8 text-left space-y-3 bg-svara-white/5">
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Kursi ({seats.length})</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
              {seats.map(s => <span key={s} className="bg-svara-orange text-white px-2 py-0.5 rounded text-xs font-bold font-mono">{s}</span>)}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Nama Pemesan</span>
            <span className="text-svara-white font-medium">{nama}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Subtotal</span>
            <span className="text-svara-white">Rp {totalHarga.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-svara-white/50">Admin fee (0,7%)</span>
            <span className="text-svara-white">Rp {adminFee.toLocaleString('id-ID')}</span>
          </div>
          <div className="border-t border-svara-white/10 pt-4 mt-2 flex justify-between items-center">
            <span className="text-svara-white font-bold tracking-widest uppercase text-xs">Total Bayar</span>
            <span className="text-svara-green font-bold text-2xl">Rp {nominalBayar.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <button
          onClick={startPolling}
          disabled={polling || loadingQris || !!qrisError}
          className="w-full bg-svara-green text-svara-black py-4 rounded-lg font-bold tracking-widest uppercase text-sm hover:bg-svara-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(46,204,113,0.2)]"
        >
          {polling
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-svara-black/30 border-t-svara-black rounded-full animate-spin" />
                Mengecek Pembayaran...
              </span>
            : 'Cek Status Pembayaran'
          }
        </button>

        <p className="text-svara-white/30 text-xs mt-6 leading-relaxed">
          QR otomatis terdeteksi setelah pembayaran berhasil. <br/> Verifikasi otomatis berjalan setiap 4 detik.
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-svara-black flex items-center justify-center text-svara-white/40">Memuat Halaman Pembayaran...</div>}>
      <PaymentContent />
    </Suspense>
  );
}