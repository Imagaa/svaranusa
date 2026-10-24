'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import axios from '@/lib/axios';
import { QrCode, CheckCircle2, XCircle, LogOut, ArrowLeft, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function ScannerOnlyPage() {
  const router = useRouter();
  const { token, clearAuth } = useAuthStore();
  
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useCamera, setUseCamera] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment'); // State arah kamera
  
  const [isInitializing, setIsInitializing] = useState(true);

  // LOGIKA MAGIC LINK (Membaca Token dari URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const magicKey = params.get('k');

    if (magicKey) {
      try {
        const decodedToken = atob(magicKey);
        setActiveToken(decodedToken);
        // Hapus token dari URL Bar agar tidak difoto/dicopy orang lain
        window.history.replaceState(null, '', '/admin/scanner-only');
      } catch (e) {
        alert('Link Scanner tidak valid / rusak.');
        router.push('/admin/login');
      }
    } else if (token) {
      // Jika tidak ada link, tapi ada sesi login admin di HP, pakai token login
      setActiveToken(token);
    } else {
      // Jika tidak punya link dan tidak login = Tendang keluar
      router.push('/admin/login');
    }
    
    setIsInitializing(false);
  }, [token, router]);

  const processScan = async (codeToScan: string) => {
    if(!codeToScan || !activeToken) return;
    setIsLoading(true);
    try {
      // Menggunakan activeToken (dari Magic Link atau Login)
      const res = await axios.post('/checkin', { ticket_code: codeToScan }, { 
          headers: { Authorization: `Bearer ${activeToken}` } 
      });
      setScanResult({ status: 'valid', data: res.data });
      setTimeout(() => setScanResult(null), 4000); 
    } catch (error: any) {
      if (error.response?.status === 409) {
        setScanResult({ status: 'used', data: error.response.data });
      } else {
        const validationError = error.response?.data?.errors?.ticket_code?.[0];
        const errorMessage = validationError || error.response?.data?.message || 'Tiket tidak valid / belum lunas';
        setScanResult({ status: 'invalid', message: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScan(manualCode);
    setManualCode('');
  };

  // Layar Hitam saat mengecek link
  if (isInitializing || !activeToken) return <div className="min-h-screen bg-black"></div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      
      {/* Header Mobile Fixed */}
      <div className="bg-zinc-900 border-b border-white/10 p-4 flex justify-between items-center z-10 shadow-lg">
        {/* Tombol kembali diarahkan ke Homepage agar jika Kru iseng, dia tidak masuk ke Admin Dashboard */}
        <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20}/> Web Utama
        </Link>
        <div className="flex gap-2">
          {useCamera && (
            <button onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')} className="text-green-400 border border-green-500/50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
              🔄 Putar
            </button>
          )}
          <button onClick={() => setUseCamera(!useCamera)} className="text-orange-400 border border-orange-500/50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
             <ScanLine size={16}/> {useCamera ? 'Manual' : 'Kamera'}
          </button>
        </div>
      </div>

      {/* Area Scanner Full Screen */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative bg-zinc-950">
        
        {useCamera ? (
          <div className="w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl bg-black relative">
            <div className="absolute inset-0 flex items-center justify-center z-0">
               <span className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
            </div>
            <div className="relative z-10 w-full h-full">
               <Scanner 
                   onScan={(result) => {
                      if(result && result[0] && !isLoading && !scanResult) {
                          processScan(result[0].rawValue);
                      }
                   }}
                   constraints={{ facingMode }}
                   formats={['qr_code']}
                   components={{ finder: true }}
                   styles={{ container: { width: '100%', height: '100%' } }}
                />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs font-mono z-10 bg-black/50 py-2 backdrop-blur-sm">
               Arahkan QR Code Tiket ke dalam kotak
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-center">Cek Tiket Manual</h2>
            <input 
              autoFocus type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="TIC-XXXXXXX"
              className="w-full bg-zinc-900 border-2 border-white/20 rounded-xl px-6 py-4 text-white font-mono text-xl uppercase text-center focus:border-green-500 focus:outline-none mb-4"
              disabled={isLoading}
            />
            <button type="submit" disabled={!manualCode || isLoading} className="w-full bg-green-600 hover:bg-green-700 py-4 font-bold rounded-xl text-lg flex justify-center items-center">
              {isLoading ? 'Memproses...' : 'Verifikasi Tiket'}
            </button>
          </form>
        )}
      </div>

      {/* POPUP OVERLAY NOTIFIKASI HASIL SCAN */}
      {scanResult && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-8 rounded-3xl border-4 flex flex-col items-center text-center shadow-2xl ${
            scanResult.status === 'valid' ? 'bg-green-950/80 border-green-500' : 
            scanResult.status === 'used' ? 'bg-orange-950/80 border-orange-500' : 
            'bg-red-950/80 border-red-500'
          }`}>
            
            {scanResult.status === 'valid' ? <CheckCircle2 className="text-green-400 w-24 h-24 mb-4 drop-shadow-lg"/> : <XCircle className={`w-24 h-24 mb-4 drop-shadow-lg ${scanResult.status === 'used' ? 'text-orange-400' : 'text-red-400'}`}/>}
            
            <h2 className={`font-black text-3xl uppercase tracking-widest mb-2 ${
              scanResult.status === 'valid' ? 'text-green-400' : 
              scanResult.status === 'used' ? 'text-orange-400' : 'text-red-400'
            }`}>
              {scanResult.status === 'valid' ? 'VALID' : scanResult.status === 'used' ? 'SUDAH DIPAKAI' : 'DITOLAK'}
            </h2>
            
            {scanResult.status !== 'valid' && scanResult.message && (
              <p className="text-white/80 mt-2 mb-6 text-lg">{scanResult.message}</p>
            )}

            {scanResult.data && (
              <div className="w-full bg-black/50 p-5 rounded-2xl mt-2 mb-8 space-y-4 border border-white/10">
                <div className="flex flex-col border-b border-white/10 pb-3">
                  <span className="text-white/50 text-sm uppercase tracking-wider mb-1">Nama Pembeli</span> 
                  <strong className="text-white text-xl">{scanResult.data.buyer_name}</strong>
                </div>
                <div className="flex flex-col border-b border-white/10 pb-3">
                  <span className="text-white/50 text-sm uppercase tracking-wider mb-1">Nomor Kursi</span> 
                  <strong className="text-white bg-white/10 py-2 rounded-lg font-mono text-3xl mx-12 border border-white/20">{scanResult.data.seat_code}</strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/50 text-xs uppercase tracking-wider mb-1">Waktu Check-in</span> 
                  <strong className={`font-mono text-sm ${scanResult.status === 'used' ? 'text-orange-400' : 'text-green-400'}`}>
                    {new Date(scanResult.data.checked_in_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}
                  </strong>
                </div>
              </div>
            )}

            <button 
              onClick={() => setScanResult(null)} 
              className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors shadow-xl"
            >
              Tutup & Lanjut Scan
            </button>
            {scanResult.status === 'valid' && <p className="text-green-400/50 text-xs mt-4 animate-pulse">Menutup otomatis dalam 4 detik...</p>}
          </div>
        </div>
      )}

    </div>
  );
}