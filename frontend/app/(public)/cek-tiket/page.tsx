'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Ticket = {
  ticket_code: string;
  ticket_number: string;
  seat_code: string;
  seat_category: string;
  buyer_name: string;
  buyer_email: string;
  price: number;
  checked_in_at: string | null;
};

type OrderHint = {
  order_code: string;
  buyer_name: string;
  email_hint: string;
  verified: false;
};

type TicketsResponse = {
  order_code: string;
  buyer_name: string;
  total_tickets: number;
  tickets: Ticket[];
  verified: true;
};

export default function CekTiketPage() {
  const [orderCode, setOrderCode]     = useState('');
  const [email, setEmail]             = useState('');
  const [hint, setHint]               = useState<OrderHint | null>(null);
  const [data, setData]               = useState<TicketsResponse | null>(null);
  const [error, setError]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Step 1: cek order code
  const handleCekOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = orderCode.trim().toUpperCase();
    if (!code) return;

    setIsLoading(true);
    setError('');
    setHint(null);
    setData(null);

    try {
      const res  = await fetch(`${API_URL}/orders/${code}/tickets`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Kode order tidak ditemukan atau belum dibayar.');
        return;
      }

      setHint(json);
    } catch {
      setError('Gagal menghubungi server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: verifikasi email
  const handleVerifikasiEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !hint) return;

    setIsLoading(true);
    setError('');

    try {
      const res  = await fetch(`${API_URL}/orders/${hint.order_code}/tickets?email=${encodeURIComponent(email.trim())}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Email tidak sesuai.');
        return;
      }

      setData(json);
    } catch {
      setError('Gagal menghubungi server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setOrderCode('');
    setEmail('');
    setHint(null);
    setData(null);
    setError('');
  };

  const handleDownload = async () => {
    if (!data || isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`${API_URL}/orders/${data.order_code}/download`);
      if (!res.ok) throw new Error('Gagal');
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `etiket-svaranusa-${data.order_code}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengunduh. Coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-svara-black px-6 py-12">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-2xl text-svara-green tracking-widest block mb-2">
            SVARANUSA
          </Link>
          <p className="text-svara-white/40 text-xs tracking-widest uppercase">Cek & Unduh E-Tiket</p>
        </div>

        {/* Step 1: Form order code */}
        {!hint && !data && (
          <form onSubmit={handleCekOrder} className="mb-10">
            <label className="block text-svara-white/60 text-xs tracking-widest uppercase mb-2">
              Kode Order
            </label>
            <p className="text-svara-white/30 text-xs mb-4 leading-relaxed">
              Masukkan kode order yang Anda terima melalui email setelah pembayaran berhasil.
              Contoh: <span className="font-mono text-svara-white/50">SVR-XXXXXXXX</span>
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={orderCode}
                onChange={e => setOrderCode(e.target.value.toUpperCase())}
                placeholder="SVR-XXXXXXXX"
                className="flex-1 bg-svara-white/5 border border-svara-white/10 text-svara-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-svara-green transition-colors tracking-widest placeholder:text-svara-white/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !orderCode.trim()}
                className="bg-svara-green text-svara-black px-6 py-3 font-semibold tracking-widest uppercase text-sm hover:bg-svara-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-svara-black/30 border-t-svara-black rounded-full animate-spin block" />
                ) : 'Cek'}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-3 leading-relaxed">{error}</p>}
          </form>
        )}

        {/* Step 2: Form email */}
        {hint && !data && (
          <form onSubmit={handleVerifikasiEmail} className="mb-10">
            <div className="border border-svara-white/10 p-4 mb-6">
              <p className="text-svara-white/40 text-xs tracking-widest uppercase mb-1">Order Ditemukan</p>
              <p className="text-svara-white font-mono text-sm">{hint.order_code}</p>
              <p className="text-svara-white/60 text-sm mt-1">a.n. {hint.buyer_name}</p>
            </div>

            <label className="block text-svara-white/60 text-xs tracking-widest uppercase mb-2">
              Verifikasi Email
            </label>
            <p className="text-svara-white/30 text-xs mb-4 leading-relaxed">
              Masukkan email yang digunakan saat pembelian.
              Petunjuk: <span className="font-mono text-svara-white/50">{hint.email_hint}</span>
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="flex-1 bg-svara-white/5 border border-svara-white/10 text-svara-white px-4 py-3 text-sm focus:outline-none focus:border-svara-green transition-colors placeholder:text-svara-white/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="bg-svara-green text-svara-black px-6 py-3 font-semibold tracking-widest uppercase text-sm hover:bg-svara-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-svara-black/30 border-t-svara-black rounded-full animate-spin block" />
                ) : 'Lanjut'}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-3 leading-relaxed">{error}</p>}
            <button
              type="button"
              onClick={handleReset}
              className="text-svara-white/30 text-xs mt-4 hover:text-svara-white/60 transition-colors"
            >
              ← Ganti kode order
            </button>
          </form>
        )}

        {/* Hasil tiket */}
        {data && (
          <div>
            <div className="border border-svara-white/10 p-4 mb-8 flex justify-between items-center">
              <div>
                <p className="text-svara-white/40 text-xs tracking-widest uppercase mb-0.5">Order</p>
                <p className="text-svara-white font-mono text-sm">{data.order_code}</p>
              </div>
              <div className="text-right">
                <p className="text-svara-white/40 text-xs tracking-widest uppercase mb-0.5">Atas Nama</p>
                <p className="text-svara-white text-sm">{data.buyer_name}</p>
              </div>
            </div>

            {data.tickets.map((ticket, idx) => (
              <div key={ticket.ticket_code} className="border border-svara-white/10 overflow-hidden mb-6">
                {/* Header zona */}
                <div className="bg-svara-green px-6 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-display text-svara-black tracking-widest text-sm">SVARANUSA 2026</p>
                    <p className="text-svara-black/60 text-xs">Surakarta, Jawa Tengah</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-svara-black text-xl">
                      {ticket.seat_code?.replace(/[0-9]/g, '')}
                    </p>
                    <p className="text-svara-black/60 text-xs">ZONA</p>
                  </div>
                </div>

                {/* Badge check-in */}
                {ticket.checked_in_at && (
                  <div className="bg-red-900/60 border-b border-red-500/30 px-6 py-2 flex items-center gap-2">
                    <span className="text-red-400 text-xs tracking-widest uppercase font-semibold">
                      ✓ Sudah Check-in
                    </span>
                    <span className="text-red-400/60 text-xs">
                      {new Date(ticket.checked_in_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {/* QR code */}
                <div className={`flex justify-center py-8 bg-white ${ticket.checked_in_at ? 'opacity-40 grayscale' : ''}`}>
                  <QRCodeSVG value={ticket.ticket_code} size={180} level="H" />
                </div>

                {/* Detail */}
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-svara-white/50">Kode Tiket</span>
                    <span className="text-svara-white font-mono text-xs">{ticket.ticket_code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-svara-white/50">Kursi</span>
                    <span className="text-svara-orange font-mono font-semibold">{ticket.seat_code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-svara-white/50">Kategori</span>
                    <span className="text-svara-white">{ticket.seat_category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-svara-white/50">Atas Nama</span>
                    <span className="text-svara-white">{ticket.buyer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-svara-white/50">Email</span>
                    <span className="text-svara-white text-xs">{ticket.buyer_email}</span>
                  </div>
                  <div className="border-t border-svara-white/10 pt-3 text-center">
                    <p className="text-svara-white/20 text-[10px] tracking-widest">
                      {ticket.ticket_number} · {data.order_code}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <p className="text-svara-white/20 text-xs text-center mb-6">
              Simpan screenshot halaman ini sebagai cadangan. Satu QR code berlaku untuk satu akses.
            </p>

            {/* Tombol Download */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full border border-svara-green/50 text-svara-green py-3.5 text-sm tracking-widest uppercase hover:bg-svara-green/10 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
            >
              {isDownloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-svara-green/30 border-t-svara-green rounded-full animate-spin" />
                  Menyiapkan PDF...
                </>
              ) : (
                'Unduh E-Tiket (PDF) ↓'
              )}
            </button>

            <button
              onClick={handleReset}
              className="w-full text-center border border-svara-white/20 text-svara-white py-3 text-sm tracking-widest uppercase hover:border-svara-white/50 transition-colors mb-3"
            >
              Cek Tiket Lain
            </button>
            <Link
              href="/"
              className="block text-center border border-svara-white/10 text-svara-white/40 py-3 text-sm tracking-widest uppercase hover:border-svara-white/30 transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
