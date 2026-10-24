'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SeatConflictModal from '../../../../src/components/ui/SeatConflictModal';
import { useSeatStatus } from '@/hooks/useSeatStatus';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const ZONE_CONFIG = {
  A: { nama: 'Zona A', harga: 50000, label: 'text-svara-gold',  border: 'border-svara-gold',  bg: 'bg-svara-gold/90 hover:bg-svara-gold text-white' },
  B: { nama: 'Zona B', harga: 40000, label: 'text-svara-green', border: 'border-svara-green', bg: 'bg-svara-green/80 hover:bg-svara-green text-white' },
  C: { nama: 'Zona C', harga: 25000, label: 'text-red-400',     border: 'border-red-500',     bg: 'bg-red-700/80 hover:bg-red-600 text-white' },
  D: { nama: 'Zona D', harga: 25000, label: 'text-red-400',     border: 'border-red-500',     bg: 'bg-red-700/80 hover:bg-red-600 text-white' },
};

const VVIP_SEATS = new Set(Array.from({ length: 32 }, (_, i) => `A${i + 1}`));
const SEAT_SIZE  = 48;

function getSessionToken(): string {
  if (typeof window === 'undefined') return '';
  
  // 1. KUNCI MUTLAK: Gunakan nama laci yang sama persis dengan yang ada di axios.ts
  const STORAGE_KEY = 'svara_session_token_v2';
  
  let token = localStorage.getItem(STORAGE_KEY);
  
  if (!token) { 
    // 2. Buat token baru dengan format selaras jika belum ada
    token = 'svr-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, token); 
  }
  
  return token;
}

type ZoneKey = 'A' | 'B' | 'C' | 'D';

function Seat({ code, zone, selected, seatStatus, onToggle }: {
  code: string; zone: ZoneKey; selected: boolean;
  seatStatus: string; onToggle: () => void;
}) {
  const isVvip = VVIP_SEATS.has(code);
  const isReserved = seatStatus === 'reserved' || seatStatus === 'locked';
  const isPaid     = seatStatus === 'paid' || seatStatus === 'sold';
  const disabled   = isVvip || isReserved || isPaid;

  let cls = 'transition-all flex items-center justify-center text-xs font-bold font-mono rounded-sm border shadow-sm '; 
  
  if (selected)        cls += 'bg-svara-orange text-white border-svara-orange scale-105 shadow-lg shadow-svara-orange/40';
  else if (isVvip)     cls += 'bg-purple-900/60 text-white cursor-not-allowed border-purple-500/30';
  else if (isPaid)     cls += 'bg-white/20 text-white/60 cursor-not-allowed border-white/20'; 
  else if (isReserved) cls += 'bg-yellow-900/70 text-white cursor-not-allowed border-yellow-500/50';
  else                 cls += `${ZONE_CONFIG[zone].bg} border-transparent`;

  return (
    <button disabled={disabled} onClick={onToggle}
      title={isVvip ? `${code} — VVIP/Media` : isPaid ? `${code} — Sudah terbeli` : isReserved ? `${code} — Sedang dipesan` : code}
      style={{ width: SEAT_SIZE, height: SEAT_SIZE }} className={cls}>
      {code}
    </button>
  );
}

function ZoneA({ selected, statusMap, onToggle }: { selected: Set<string>; statusMap: Record<string, any>; onToggle: (s: string) => void }) {
  return (
    <div className={`border-2 ${ZONE_CONFIG.A.border} p-3`}>
      <p className={`text-xs tracking-widest uppercase text-center mb-2 ${ZONE_CONFIG.A.label}`}>Zona A — Rp {ZONE_CONFIG.A.harga.toLocaleString('id-ID')}</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(16, ${SEAT_SIZE}px)` }}>
        {Array.from({ length: 144 }, (_, i) => { const code = `A${i + 1}`; return <Seat key={code} code={code} zone="A" selected={selected.has(code)} seatStatus={statusMap[code] as string ?? 'available'} onToggle={() => onToggle(code)} />; })}
      </div>
    </div>
  );
}

function ZoneB({ selected, statusMap, onToggle }: { selected: Set<string>; statusMap: Record<string, any>; onToggle: (s: string) => void }) {
  return (
    <div className={`border-2 ${ZONE_CONFIG.B.border} p-3`}>
      <p className={`text-xs tracking-widest uppercase text-center mb-2 ${ZONE_CONFIG.B.label}`}>Zona B — Rp {ZONE_CONFIG.B.harga.toLocaleString('id-ID')}</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(16, ${SEAT_SIZE}px)` }}>
        {Array.from({ length: 160 }, (_, i) => { const code = `B${i + 1}`; return <Seat key={code} code={code} zone="B" selected={selected.has(code)} seatStatus={statusMap[code] as string ?? 'available'} onToggle={() => onToggle(code)} />; })}
      </div>
    </div>
  );
}

function ZoneSide({ prefix, zone, cols, rows, startNum, label, selected, statusMap, onToggle }: {
  prefix: string; zone: 'C' | 'D'; cols: number; rows: number; startNum: number; label: string;
  selected: Set<string>; statusMap: Record<string, any>; onToggle: (s: string) => void;
}) {
  return (
    <div className={`border-2 ${ZONE_CONFIG[zone].border} p-2`}>
      <p className={`text-xs tracking-widest uppercase text-center mb-2 ${ZONE_CONFIG[zone].label}`}>{label}</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, ${SEAT_SIZE}px)` }}>
        {Array.from({ length: cols * rows }, (_, i) => { const code = `${prefix}${startNum + i}`; return <Seat key={code} code={code} zone={zone} selected={selected.has(code)} seatStatus={statusMap[code] as string ?? 'available'} onToggle={() => onToggle(code)} />; })}
      </div>
    </div>
  );
}

function Aisle() {
  return (
    <div className="flex items-stretch justify-center flex-shrink-0" style={{ width: 32 }}>
      <div className="flex flex-col items-center gap-1 w-full py-2 opacity-25">
        <div className="w-px flex-1 bg-white/40" />
        <span className="text-white/60 text-[9px] tracking-widest flex-shrink-0" style={{ writingMode: 'vertical-rl' }}>LORONG</span>
        <div className="w-px flex-1 bg-white/40" />
      </div>
    </div>
  );
}

function SwipeHint({ visible, isTouch, onDismiss }: { visible: boolean; isTouch: boolean; onDismiss: () => void }) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ease-in-out pointer-events-none ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        <div className="space-y-2">
          <p className="text-white font-bold text-xl tracking-widest uppercase">{isTouch ? '👆 Geser & Cubit untuk Zoom' : '🖱️ Geser untuk Navigasi'}</p>
          <p className="text-white/60 text-sm">{isTouch ? 'Ketuk kursi untuk memilih • Cubit layar untuk zoom in/out' : 'Klik & seret peta • Scroll untuk zoom • Klik kursi untuk memilih'}</p>
        </div>
        <button onClick={onDismiss} className="pointer-events-auto mt-2 text-white/40 text-xs border border-white/20 px-6 py-2 tracking-widest uppercase hover:text-white/70 hover:border-white/40 transition-colors">Mengerti →</button>
      </div>
    </div>
  );
}

type ReservationState = { step: 'idle' } | { step: 'loading' } | { step: 'conflict'; conflict: string[]; available: string[] } | { step: 'confirm'; available: string[] };

function SeatmapContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const show          = searchParams.get('show') ?? 'show1';
  const showLabel     = show === 'show1' ? 'Show 1 — 18.00 WIB' : 'Show 2 — 20.00 WIB';

  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const { statusMap, isLoading, isConnected, isServerError, isClosed } = useSeatStatus(show);
  const [reservation, setReservation]          = useState<ReservationState>({ step: 'idle' });
  const [expiredAt, setExpiredAt]              = useState<Date | null>(null);
  const [countdown, setCountdown]              = useState('');
  const [showModal, setShowModal]              = useState(false);
  const [nominalInput, setNominalInput]        = useState('');
  const [nominalError, setNominalError]        = useState('');
  const [showHint, setShowHint]                = useState(true);
  const [isTouch, setIsTouch]                  = useState(false);
  const [toastMsg, setToastMsg]                = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // --- STATE & FUNGSI RESUME PAYMENT ---
  const [activeOrderPending, setActiveOrderPending] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('svara_active_order_v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (new Date(parsed.expires_at).getTime() > Date.now()) {
          setActiveOrderPending(parsed);
        } else {
          localStorage.removeItem('svara_active_order_v2');
        }
      } catch(e) {
        localStorage.removeItem('svara_active_order_v2');
      }
    }
  }, []);

  const handleResumePayment = () => {
    const params = new URLSearchParams(activeOrderPending);
    router.push(`/beli/payment?${params.toString()}`);
  };

  const handleCancelPendingOrder = async () => {
    setReservation({ step: 'loading' });
    try {
      // Menembak API Cancel (Backend Anda harus sudah siap menerima ini nanti)
      await fetch(`${API_URL}/orders/${activeOrderPending.order_code}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': getSessionToken() }
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('svara_active_order_v2');
    setActiveOrderPending(null);
    window.location.reload(); 
  };

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => { setIsTouch(window.matchMedia('(pointer: coarse)').matches); }, []);
  useEffect(() => { const t = setTimeout(() => setShowHint(false), 4000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => { el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; });
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismissHint = () => setShowHint(false);

  useEffect(() => {
    if (!expiredAt) return;
    const interval = setInterval(() => {
      const diff = expiredAt.getTime() - Date.now();
      if (diff <= 0) { setCountdown('00:00'); setExpiredAt(null); setReservation({ step: 'idle' }); setSelectedSeats(new Set()); setShowModal(false); clearInterval(interval); return; }
      const m = String(Math.floor(diff / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setCountdown(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  const toggleSeat = (code: string) => {
    if (VVIP_SEATS.has(code)) return;
    
    const currentStatus = statusMap[code] as string | undefined;
    if (currentStatus === 'reserved' || currentStatus === 'paid' || currentStatus === 'locked' || currentStatus === 'sold') return;
    
    // FIX: Cegah user memilih lebih dari 15 kursi
    if (!selectedSeats.has(code) && selectedSeats.size >= 15) {
      setToastMsg('Maksimal pemilihan adalah 15 tiket dalam satu kali pesanan.');
      return;
    }

    setSelectedSeats(prev => { 
      const next = new Set(prev); 
      next.has(code) ? next.delete(code) : next.add(code); 
      return next; 
    });
  };

  const getHarga = (code: string) => {
    if (code.startsWith('A')) return ZONE_CONFIG.A.harga;
    if (code.startsWith('B')) return ZONE_CONFIG.B.harga;
    return ZONE_CONFIG.C.harga;
  };

  const seats      = Array.from(selectedSeats);
  const totalHarga = seats.reduce((sum, s) => sum + getHarga(s), 0);
  const adminFee   = Math.ceil(totalHarga * 0.007);
  const grandTotal = totalHarga + adminFee;
  const nominalBayar = nominalInput === '' ? grandTotal : Number(nominalInput.replace(/\D/g, ''));

  const handleLanjut = async () => {
    if (selectedSeats.size === 0) return;
    
    setReservation({ step: 'loading' });
    try {
      const res = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': getSessionToken() },
        body: JSON.stringify({ seats, show }),
      });
      const data = await res.json();
      if (res.ok) { setExpiredAt(new Date(data.expired_at)); setReservation({ step: 'idle' }); setNominalInput(''); setNominalError(''); setShowModal(true); }
      else if (data.status === 'partial_conflict') { setReservation({ step: 'conflict', conflict: data.conflict, available: data.available }); }
      else { setReservation({ step: 'conflict', conflict: data.conflict || [], available: [] }); }
    } catch { setReservation({ step: 'idle' }); setToastMsg('Gagal menghubungi server, coba lagi.'); }
  };

  const handleConflictContinue = () => {
    if (reservation.step !== 'conflict') return;
    if (reservation.available.length === 0) { setReservation({ step: 'idle' }); return; }
    setReservation({ step: 'confirm', available: reservation.available });
  };

  const handleConfirmContinue = async () => {
    if (reservation.step !== 'confirm') return;
    const availableSeats = reservation.available;
    setReservation({ step: 'loading' });
    try {
      const res = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': getSessionToken() },
        body: JSON.stringify({ seats: availableSeats, show }),
      });
      const data = await res.json();
      if (res.ok) { setSelectedSeats(new Set(availableSeats)); setExpiredAt(new Date(data.expired_at)); setReservation({ step: 'idle' }); setNominalInput(''); setNominalError(''); setShowModal(true); }
      else { setReservation({ step: 'conflict', conflict: data.conflict ?? [], available: data.available ?? [] }); }
    } catch { setReservation({ step: 'idle' }); setToastMsg('Gagal menghubungi server, coba lagi.'); }
  };

  const handleBatal = () => {
  fetch(`${API_URL}/reservations`, { 
    method: 'DELETE', 
    headers: { 
      'Content-Type': 'application/json', 
      'X-Session-Token': getSessionToken() 
    }
  });
  setReservation({ step: 'idle' }); 
  setShowModal(false); 
  setExpiredAt(null);
};

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setNominalInput(raw);
    setNominalError(raw && Number(raw) < grandTotal ? `Minimal Rp ${grandTotal.toLocaleString('id-ID')}` : '');
  };

  const handleKonfirmasi = async () => {
    if (nominalBayar < grandTotal) return;

    // Melempar data ke URL Formulir
    const params = new URLSearchParams({
      seats: seats.join(','),
      total_harga: totalHarga.toString(),
      admin_fee: adminFee.toString(),
      grand_total: grandTotal.toString(),
      nominal_bayar: nominalBayar.toString(),
      show: show
    });
    router.push(`/beli/formulir?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-svara-black">
      <SwipeHint visible={showHint} isTouch={isTouch} onDismiss={dismissHint} />

      <div className="border-b border-svara-white/10 px-6 py-4 flex justify-between items-center sticky top-0 bg-svara-black z-20">
        <div className="flex items-center gap-4">
          <Link href="/beli" className="font-display text-lg text-svara-green tracking-widest">SVARANUSA</Link>
          <span className="text-svara-white/30 text-xs hidden sm:block">|</span>
          <span className="text-svara-orange text-xs tracking-widest hidden sm:block">{showLabel}</span>
        </div>
        <div className="flex items-center gap-4">
          {isConnected && <span className="text-svara-green/60 text-xs flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-svara-green animate-pulse" />Live</span>}
          {countdown && <span className="text-svara-orange font-mono text-sm bg-svara-orange/10 px-3 py-1 rounded">⏱ {countdown}</span>}
          <Link href="/beli" className="text-svara-white/30 text-xs hover:text-svara-white">← Ganti Show</Link>
        </div>
      </div>

      {/* MODAL RESUME PAYMENT */}
      {activeOrderPending && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-svara-orange/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_40px_rgba(234,88,12,0.2)] relative p-6 text-center">
            <div className="w-16 h-16 bg-orange-500/10 text-orange-500 flex items-center justify-center rounded-full mx-auto mb-4 border border-orange-500/20">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-display tracking-widest">Transaksi Tertunda</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Anda memiliki pesanan tiket <b className="text-svara-orange">({activeOrderPending.order_code})</b> yang sedang menunggu pembayaran.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleResumePayment} className="w-full bg-svara-green hover:bg-svara-green/90 text-svara-black py-3.5 px-4 rounded-xl font-bold text-sm transition-colors uppercase tracking-widest">
                Lanjut Pembayaran →
              </button>
              <button onClick={handleCancelPendingOrder} className="w-full border border-white/20 text-white/70 py-3 px-4 rounded-xl font-bold text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors tracking-widest uppercase">
                Batalkan & Pilih Kursi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {(reservation.step === 'conflict' || reservation.step === 'confirm') && (
        <SeatConflictModal
          step={reservation.step}
          conflict={reservation.step === 'conflict' ? reservation.conflict : []}
          available={reservation.available}
          onContinue={reservation.step === 'conflict' ? handleConflictContinue : handleConfirmContinue}
          onCancel={() => setReservation({ step: 'idle' })}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleBatal} />
          <div className="relative bg-svara-black border border-svara-white/20 w-full sm:max-w-md mx-0 sm:mx-4 p-6">
            <h2 className="font-display text-xl text-svara-white mb-1">Rincian Kursi</h2>
            <p className="text-svara-orange text-xs tracking-widest mb-1">{showLabel}</p>
            {countdown && <p className="text-svara-orange text-xs font-mono mb-5">Kursi diamankan selama: {countdown}</p>}
            <div className="space-y-3 mb-6">
              <div className="flex flex-wrap gap-1 mb-3">{seats.map(s => <span key={s} className="text-svara-white text-xs font-bold font-mono bg-svara-orange px-2 py-1 rounded">{s}</span>)}</div>
              <div className="flex justify-between text-sm"><span className="text-svara-white/50">Subtotal ({seats.length} kursi)</span><span className="text-svara-white">Rp {totalHarga.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-svara-white/50">Admin fee (0,7%)</span><span className="text-svara-white">Rp {adminFee.toLocaleString('id-ID')}</span></div>
              <div className="border-t border-svara-white/10 pt-3 flex justify-between"><span className="text-svara-white font-semibold">Total Tiket</span><span className="text-svara-white font-semibold">Rp {grandTotal.toLocaleString('id-ID')}</span></div>
            </div>
            <div className="mb-5">
              <label className="block mb-1 text-svara-white/70 text-xs tracking-widest uppercase">Nominal Pembayaran</label>
              <p className="text-svara-white/30 text-xs leading-relaxed mb-2">Bila Anda berkenan, Anda dapat memasukkan nominal melebihi total tiket sebagai wujud dukungan (Donasi).</p>
              <input type="text" inputMode="numeric" value={nominalInput ? `Rp ${Number(nominalInput).toLocaleString('id-ID')}` : ''} onChange={handleNominalChange} placeholder={`Rp ${grandTotal.toLocaleString('id-ID')}`}
                className="w-full bg-svara-white/5 border border-svara-white/10 text-svara-white px-4 py-3 text-sm focus:outline-none focus:border-svara-green transition-colors" />
              {nominalError && <p className="text-red-400 text-xs mt-1">{nominalError}</p>}
              {nominalBayar > grandTotal && <p className="text-svara-green text-xs mt-1">+ Rp {(nominalBayar - grandTotal).toLocaleString('id-ID')} — Terima kasih atas donasinya 🙏</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={handleBatal} className="flex-1 border border-svara-white/20 text-svara-white py-3 text-sm tracking-widest uppercase hover:border-svara-white/50 transition-colors">Batal</button>
              <button onClick={handleKonfirmasi} disabled={nominalBayar < grandTotal}
                className="flex-1 bg-svara-green text-svara-black py-3 font-semibold tracking-widest uppercase text-sm hover:bg-svara-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Lanjut Isi Data →</button>
            </div>
          </div>
        </div>
      )}

      {reservation.step === 'loading' && (
        <div className="fixed inset-0 z-40 bg-svara-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-svara-white/20 border-t-svara-green rounded-full animate-spin" />
            <p className="text-svara-white/60 text-sm tracking-widest">Mengecek ketersediaan...</p>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        onScroll={dismissHint} onTouchStart={dismissHint} onMouseDown={dismissHint}>
        <div className="w-max mx-auto px-6 py-8">
          
          <div className="flex justify-center mb-8">
            <div className="border-2 border-svara-white/30 bg-svara-white/5 px-24 py-5 text-center shadow-lg">
              <p className="text-svara-white/90 text-base tracking-[0.5em] uppercase font-bold">★ PANGGUNG UTAMA ★</p>
              <p className="text-svara-white/50 text-xs tracking-widest mt-2">GAMELAN</p>
            </div>
          </div>

          <div className="flex items-start gap-0 mb-4">
            <ZoneSide prefix="CL" zone="C" cols={5} rows={9} startNum={1} label="C Kiri (45)" selected={selectedSeats} statusMap={statusMap} onToggle={toggleSeat} />
            <Aisle />
            <ZoneA selected={selectedSeats} statusMap={statusMap} onToggle={toggleSeat} />
            <Aisle />
            <ZoneSide prefix="CR" zone="C" cols={5} rows={9} startNum={46} label="C Kanan (45)" selected={selectedSeats} statusMap={statusMap} onToggle={toggleSeat} />
          </div>

          <div className="flex items-center my-4 px-2">
            <div className="flex-1 border-t-2 border-dashed border-svara-white/20" />
            <span className="text-svara-white/40 text-xs tracking-[0.3em] px-8 bg-svara-black uppercase font-bold">↕ Lorong Tengah ↕</span>
            <div className="flex-1 border-t-2 border-dashed border-svara-white/20" />
          </div>

          <div className="flex items-start gap-0 mt-4">
            <ZoneSide prefix="DL" zone="D" cols={5} rows={10} startNum={1} label="D Kiri (50)" selected={selectedSeats} statusMap={statusMap} onToggle={toggleSeat} />
            <Aisle />
            <ZoneB selected={selectedSeats} statusMap={statusMap} onToggle={toggleSeat} />
            <Aisle />
            <ZoneSide prefix="DR" zone="D" cols={5} rows={10} startNum={51} label="D Kanan (50)" selected={selectedSeats} statusMap={statusMap} onToggle={toggleSeat} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 mb-4 bg-svara-white/5 px-6 py-4 rounded-lg border border-svara-white/10">
            {[
              { color: 'bg-svara-gold/90', label: 'Zona A — Rp 50.000' },
              { color: 'bg-svara-green/80', label: 'Zona B — Rp 40.000' },
              { color: 'bg-red-700/80', label: 'Zona C & D — Rp 25.000' },
              { color: 'bg-purple-900/60 border border-purple-500/30', label: 'VVIP/Media' },
              { color: 'bg-yellow-900/70 border border-yellow-500/50', label: 'Sedang dipesan' },
              { color: 'bg-white/20 border border-white/20', label: 'Sudah terbeli' },
              { color: 'bg-svara-orange', label: 'Dipilih' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-sm flex-shrink-0 shadow-sm ${item.color}`} />
                <span className="text-svara-white/70 text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-svara-black border-t border-svara-white/10 px-6 py-4 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-xs">
            {!showHint && (
              <button onClick={() => setShowHint(true)} className="text-svara-white/30 text-xs border border-svara-white/10 px-3 py-1.5 rounded hover:text-svara-white/60 hover:border-svara-white/20 transition-colors">← Geser peta →</button>
            )}
          </div>
          <div className="flex items-center gap-4 ml-auto w-full sm:w-auto">
            {seats.length > 0 && (
              <div className="text-right flex-1 sm:flex-none">
                <p className="text-svara-white/40 text-xs">{seats.length} kursi · {showLabel}</p>
                <p className="text-svara-white font-semibold text-base">Rp {grandTotal.toLocaleString('id-ID')}</p>
              </div>
            )}
            <button onClick={handleLanjut} disabled={seats.length === 0 || reservation.step === 'loading' || isServerError}
              className="bg-svara-green text-svara-black px-8 py-3.5 font-bold tracking-widest uppercase text-sm rounded-md hover:bg-svara-green/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(46,204,113,0.3)] w-full sm:w-auto">
              {reservation.step === 'loading' ? 'Memproses...' : `Lanjut (${seats.length}) →`}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-svara-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-svara-white/20 border-t-svara-green rounded-full animate-spin" />
            <p className="text-svara-white/40 text-sm tracking-widest">Memuat denah kursi...</p>
          </div>
        </div>
      )}

      {/* COMPONENT TOAST MELAYANG */}
      {toastMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 w-max max-w-[90vw]">
          <div className="bg-white text-black px-6 py-3 rounded-xl border-2 shadow-2xl text-sm font-bold tracking-wide text-center" style={{ borderColor: '#bee94e' }}>
            {toastMsg}
          </div>
        </div>
      )}

      {/* COMPONENT: FULLSCREEN OVERLAY JIKA PENDAFTARAN DITUTUP */}
      {isClosed && !isServerError && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse"></div>
            <div className="w-20 h-20 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mx-auto mb-6 border border-red-500/20">
              <span className="text-4xl">🛑</span>
            </div>
            <h2 className="font-display text-2xl text-white mb-3 tracking-wide">Pendaftaran Ditutup</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Mohon maaf, pemesanan tiket publik untuk sesi ini telah ditutup oleh penyelenggara.
            </p>
            <Link href="/beli" className="block w-full bg-svara-green text-svara-black py-4 rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-svara-green/90 transition-colors shadow-[0_0_20px_rgba(46,204,113,0.2)]">
              Kembali ke Menu Utama
            </Link>
          </div>
        </div>
      )}

      {/* COMPONENT: FULLSCREEN MAINTENANCE OVERLAY JIKA BACKEND MATI */}
      {isServerError && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="max-w-md w-full bg-zinc-900 border border-orange-500/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-pulse"></div>
            <div className="w-20 h-20 bg-orange-500/10 text-orange-500 flex items-center justify-center rounded-full mx-auto mb-6 border border-orange-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="font-display text-2xl text-white mb-3 tracking-wide">Sistem Sedang Sinkronisasi</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Pemesanan tiket ditangguhkan sementara karena koneksi ke server pusat sedang mengalami gangguan. Hal ini dilakukan untuk mencegah kesalahan transaksi Anda.
            </p>
            <button onClick={() => window.location.reload()} className="w-full bg-svara-green text-svara-black py-4 rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-svara-green/90 transition-colors shadow-[0_0_20px_rgba(46,204,113,0.2)]">
              Coba Muat Ulang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SeatmapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-svara-black flex items-center justify-center text-svara-white/40">Memuat denah...</div>}>
      <SeatmapContent />
    </Suspense>
  );
}