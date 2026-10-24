'use client';

import { Suspense, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function EtiketContent() {
  const searchParams = useSearchParams();

  const orderCode   = searchParams.get('order_code') || '';
  const seats       = (searchParams.get('seats') || '').split(',').filter(Boolean);
  const ticketCodes = (searchParams.get('ticket_codes') || '').split(',').filter(Boolean);
  const grandTotal  = Number(searchParams.get('grand_total') || 0);
  const nama        = searchParams.get('nama') || '';
  const email       = searchParams.get('email') || '';

  const ticketRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < ticketRefs.current.length; i++) {
        const el = ticketRefs.current[i];
        if (!el) continue;

        const canvas = await html2canvas(el, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#0a0a0a',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const ratio   = canvas.height / canvas.width;
        const imgH    = pageW * ratio;
        const offsetY = (pageH - imgH) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, Math.max(0, offsetY), pageW, imgH);
      }

      pdf.save(`etiket-svaranusa-${orderCode}.pdf`);
    } catch (err) {
      console.error('Download gagal:', err);
      alert('Gagal mengunduh e-tiket. Coba screenshot halaman ini sebagai cadangan.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-svara-black px-6 py-12">
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl text-svara-green tracking-widest block mb-2">
            SVARANUSA
          </Link>
          <p className="text-svara-white/40 text-xs tracking-widest uppercase">E-Tiket Resmi</p>
        </div>

        {/* Panduan */}
        <div className="bg-svara-green/10 border border-svara-green/30 p-5 mb-8 space-y-3">
          <p className="text-svara-green font-semibold text-xs tracking-widest uppercase mb-3">Panduan Penggunaan E-Tiket</p>
          <p className="text-svara-white/70 text-sm leading-relaxed">
            1. Tunjukkan halaman ini atau <strong className="text-svara-white">simpan tangkapan layar</strong> e-tiket Anda sebagai cadangan.
          </p>
          <p className="text-svara-white/70 text-sm leading-relaxed">
            2. Anda dapat <strong className="text-svara-white">mengunduh e-tiket</strong> dalam format PDF melalui tombol di bawah.
          </p>
          <p className="text-svara-white/70 text-sm leading-relaxed">
            3. Setiap QR code hanya berlaku untuk <strong className="text-svara-white">satu kali akses</strong>. Bila beli lebih dari satu, distribusikan masing-masing tiket ke pemegang yang bersangkutan.
          </p>
          <p className="text-svara-white/70 text-sm leading-relaxed">
            4. Petugas akan memindai QR code di pintu masuk. Pastikan layar <strong className="text-svara-white">terang dan tidak terpotong</strong>.
          </p>
        </div>

        {/* Kartu tiket — dikumpulkan via ref untuk di-render ke PDF */}
        {seats.map((seat, idx) => {
          const ticketCode = ticketCodes[idx];

          if (!ticketCode) {
            return (
              <div key={seat} className="border border-red-500/30 bg-red-500/10 p-6 mb-6 text-center">
                <p className="text-red-400 text-sm mb-1">Tiket kursi {seat} tidak ditemukan.</p>
                <p className="text-svara-white/40 text-xs">Hubungi panitia dengan kode order: {orderCode}</p>
              </div>
            );
          }

          return (
            <div
              key={seat}
              ref={el => { ticketRefs.current[idx] = el; }}
              className="border border-svara-white/10 overflow-hidden mb-6"
            >
              {/* Header zona */}
              <div className="bg-svara-green px-6 py-3 flex justify-between items-center">
                <div>
                  <p className="font-display text-svara-black tracking-widest text-sm">SVARANUSA 2026</p>
                  <p className="text-svara-black/60 text-xs">Surakarta, Jawa Tengah</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-svara-black text-xl">{seat.replace(/[0-9]/g, '')}</p>
                  <p className="text-svara-black/60 text-xs">ZONA</p>
                </div>
              </div>

              {/* QR code */}
              <div className="flex justify-center py-8 bg-white">
                <QRCodeSVG value={ticketCode} size={180} level="H" />
              </div>

              {/* Detail */}
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-svara-white/50">Kode Tiket</span>
                  <span className="text-svara-white font-mono text-xs">{ticketCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-svara-white/50">Kursi</span>
                  <span className="text-svara-orange font-mono font-semibold">{seat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-svara-white/50">Nama</span>
                  <span className="text-svara-white">{nama}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-svara-white/50">Email</span>
                  <span className="text-svara-white text-xs">{email}</span>
                </div>
                <div className="border-t border-svara-white/10 pt-3 text-center">
                  <p className="text-svara-white/20 text-[10px] tracking-widest">
                    TIKET {idx + 1} DARI {seats.length} · {orderCode}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="border border-svara-white/10 p-4 mb-6 flex justify-between items-center">
          <span className="text-svara-white/50 text-sm">Total Dibayar</span>
          <span className="text-svara-green font-semibold">Rp {grandTotal.toLocaleString('id-ID')}</span>
        </div>

        <p className="text-svara-white/20 text-xs text-center mb-6">
          Simpan tangkapan layar halaman ini sebagai cadangan. Satu QR code berlaku untuk satu akses.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full border border-svara-green/50 text-svara-green py-3.5 text-sm tracking-widest uppercase hover:bg-svara-green/10 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <Link
            href="/"
            className="block text-center border border-svara-white/20 text-svara-white py-3 text-sm tracking-widest uppercase hover:border-svara-white/50 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function EtiketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-svara-black flex items-center justify-center">
        <p className="text-svara-white/50 text-sm tracking-widest">Memuat tiket...</p>
      </div>
    }>
      <EtiketContent />
    </Suspense>
  );
}
