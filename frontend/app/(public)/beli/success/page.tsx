'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, CheckCircle2, MailWarning, MessageCircleQuestion } from 'lucide-react';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function SuccessContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const orderCode  = searchParams.get('order_code') || '';
  const seats      = (searchParams.get('seats') || '').split(',').filter(Boolean);
  const grandTotal = Number(searchParams.get('grand_total') || 0);
  const nama       = searchParams.get('nama') || '';
  const email      = searchParams.get('email') || '';

  const [verified, setVerified]       = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Verifikasi ke backend bahwa order benar-benar sudah lunas
  useEffect(() => {
    if (!orderCode) {
      setVerifyError('Kode Pesanan tidak ditemukan.');
      return;
    }

    fetch(`${API_URL}/orders/${orderCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'paid') {
          // Jika belum dibayar (misal user asal ketik URL), kembalikan ke halaman payment
          router.replace(
            `/beli/payment?order_code=${orderCode}`
            + `&seats=${seats.join(',')}`
            + `&nama=${encodeURIComponent(nama)}`
            + `&email=${encodeURIComponent(email)}`
            + `&grand_total=${grandTotal}`
            + `&expires_at=${encodeURIComponent(data.expires_at ?? '')}`
          );
          return;
        }
        // Jika sukses dibayar, tampilkan halaman ini
        setVerified(true);
        localStorage.removeItem('svara_active_order_v2'); // HAPUS MEMORI ORDER
      })
      .catch(() => {
        setVerifyError('Gagal memverifikasi pembayaran dengan server. Coba refresh halaman.');
      });
  }, [orderCode, router, seats, nama, email, grandTotal]);

  if (verifyError) {
    return (
      <div className="min-h-screen bg-svara-black flex items-center justify-center px-6">
        <div className="text-center bg-zinc-900 border border-red-500/30 p-8 rounded-2xl max-w-sm w-full shadow-2xl">
          <p className="text-red-400 mb-6 text-sm">{verifyError}</p>
          <Link href="/beli" className="bg-svara-green text-svara-black px-6 py-3 rounded-md text-sm font-bold uppercase tracking-widest hover:bg-svara-green/90 transition-colors block w-full">
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-svara-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-svara-white/60">
          <div className="w-8 h-8 border-2 border-svara-white/20 border-t-svara-green rounded-full animate-spin" />
          <p className="tracking-widest text-sm uppercase">Memverifikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-svara-black pt-28 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden text-center">
          
          {/* Aksen background glow hijau tanda sukses */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-16 w-32 h-32 bg-svara-green/20 blur-3xl rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-svara-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-svara-green" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Pembayaran Berhasil!</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed px-4">
              Terima kasih, <strong>{nama}</strong>.<br/> 
              Tiket Anda telah berhasil dikonfirmasi.
            </p>

            {/* Kotak Info Penting */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
              <MailWarning className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100/80 leading-relaxed">
                <p className="font-bold text-blue-300 mb-1">Informasi Pengiriman E-Ticket</p>
                Kami juga mengirimkan salinan E-Ticket ke email Anda secara bertahap (maks. 1x24 jam). 
                <strong> Cek folder SPAM / Junk</strong> jika tidak menemukannya di Kotak Masuk.
              </div>
            </div>

            {/* Ringkasan Order */}
            <div className="bg-black/50 border border-white/5 rounded-xl p-5 mb-6 text-left space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                <span className="text-gray-400">Kode Pesanan</span>
                <span className="text-white font-mono font-bold tracking-widest bg-white/10 px-2.5 py-1 rounded">{orderCode}</span>
              </div>
              <div className="flex justify-between items-start text-sm border-b border-white/5 pb-3">
                <span className="text-gray-400 mt-1">Nomor Kursi</span>
                <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                  {seats.map(s => <span key={s} className="bg-svara-orange text-white px-2 py-0.5 rounded text-xs font-bold font-mono">{s}</span>)}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                <span className="text-gray-400">Email Tujuan</span>
                <span className="text-white font-medium truncate max-w-[60%]">{email}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-400 text-xs tracking-widest uppercase font-bold">Lunas Terbayar</span>
                <span className="text-svara-green font-bold text-lg">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="space-y-4 mb-8">
              {/* Tombol Download Diutamakan */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-svara-green to-emerald-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                <a 
                  href={`${API_URL}/orders/${orderCode}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full flex items-center justify-center gap-2 bg-svara-green text-svara-black py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all hover:bg-svara-green/90"
                >
                  <Download className="w-5 h-5" />
                  <span>Sangat Disarankan: Unduh E-Ticket Disini</span>
                </a>
              </div>
              
              <Link 
                href="/" 
                className="w-full flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 py-3 rounded-xl text-sm tracking-widest uppercase transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>

            {/* Bantuan CS */}
            <div className="border-t border-white/10 pt-6 text-sm flex flex-col items-center">
              <p className="text-gray-500 mb-3">Ada kendala atau belum menerima tiket?</p>
              <a 
                href="https://wa.me/6281333899636" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-svara-orange hover:text-orange-400 transition-colors bg-svara-orange/10 px-4 py-2 rounded-full font-medium"
              >
                <MessageCircleQuestion className="w-4 h-4" />
                Hubungi CS: Priskila Winnie
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-svara-black flex items-center justify-center text-svara-white/40">Memuat Halaman...</div>}>
      <SuccessContent />
    </Suspense>
  );
}