"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCheckoutStore } from "@/lib/checkoutStore";
import { User, Mail, Phone, ArrowRight, AlertTriangle, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// Fungsi untuk mengambil token kursi
function getSessionToken(): string {
  if (typeof window === 'undefined') return '';
  const STORAGE_KEY = 'svara_session_token_v2';
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) { 
    token = 'svr-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36); 
    localStorage.setItem(STORAGE_KEY, token); 
  }
  return token;
}

function FormulirContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const showId       = searchParams.get('show') || 'show1';
  const seats        = (searchParams.get('seats') || '').split(',').filter(Boolean);
  const grandTotal   = searchParams.get('grand_total') || '0';
  const nominalBayar = searchParams.get('nominal_bayar') || '0';
  const totalHarga   = searchParams.get('total_harga') || '0';
  const adminFee     = searchParams.get('admin_fee') || '0';
  
  const { customer, setCustomer } = useCheckoutStore();
  const [loading, setLoading] = useState(false);
  
  // State untuk popup konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [modalMsg, setModalMsg] = useState<{title: string, desc: string} | null>(null);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({ name: customer.name, email: customer.email, whatsapp: customer.whatsapp });
    }
  }, [customer]);

  // Kembalikan ke seatmap jika URL tidak membawa data kursi
  useEffect(() => {
    if (seats.length === 0) {
      router.replace(`/beli/seatmap?show=${showId}`);
    }
  }, [seats, router, showId]);

  // Handle klik tombol submit di form -> Buka Modal
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.whatsapp) {
      setModalMsg({ title: 'Data Belum Lengkap', desc: 'Mohon lengkapi semua data sebelum melanjutkan.' });
      return;
    }
    setShowConfirmModal(true);
  };

  // Fungsi asli untuk menembak API (Dijalankan dari dalam Modal)
  const processCheckout = async () => {
    // 1. SANITASI DATA (Pembersihan Spasi & Format Nomor HP)
    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    
    // Ubah awalan 0 menjadi 62 dan buang karakter selain angka (spasi, strip, +)
    let cleanPhone = formData.whatsapp.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    // Update state customer dengan data yang sudah bersih
    setCustomer({ name: cleanName, email: cleanEmail, whatsapp: cleanPhone });
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'X-Session-Token': getSessionToken() 
        },
        body: JSON.stringify({
          seat_codes: seats,
          buyer_name: cleanName,      // Gunakan data bersih
          buyer_email: cleanEmail,    // Gunakan data bersih
          buyer_phone: cleanPhone,    // Gunakan data bersih
          nominal_bayar: Number(nominalBayar),
          show: showId
        })
      });

      const data = await res.json();

      if (res.ok) {
        const orderData = {
          order_code: data.order_code,
          seats: seats.join(','),
          total_harga: totalHarga,
          admin_fee: adminFee,
          grand_total: grandTotal,
          nominal_bayar: nominalBayar,
          expires_at: data.expires_at,
          nama: cleanName,            // Gunakan data bersih
          email: cleanEmail           // Gunakan data bersih
        };
        
        // Simpan memori pesanan ke local storage untuk fitur Resume Payment
        localStorage.setItem('svara_active_order_v2', JSON.stringify(orderData));

        const params = new URLSearchParams(orderData);
        router.push(`/beli/payment?${params.toString()}`);
      } else {
        
        // 2. TANGKAP PESAN ERROR DETAIL DARI LARAVEL JIKA VALIDASI GAGAL
        let errorMessage = data.message || 'Maaf, terjadi kesalahan saat membuat pesanan.';
        if (data.errors) {
           const errorDetails = Object.values(data.errors).flat().join('\n- ');
           errorMessage = `Validasi Gagal:\n- ${errorDetails}`;
        }
        
        setToastMsg(errorMessage);
        setLoading(false);
        setShowConfirmModal(false);
      }
    } catch (error) {
      setToastMsg('Gagal menghubungi server. Periksa koneksi internet Anda.');
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-28 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-zinc-800 border border-orange-500 text-orange-500 rounded-full flex items-center justify-center font-bold text-sm">✓</div>
            <span className="text-gray-400 text-xs mt-2">Pilih Kursi</span>
          </div>
          <div className="flex-grow h-px bg-orange-600/50 mx-4"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(234,88,12,0.5)]">2</div>
            <span className="text-orange-500 text-xs mt-2 font-medium">Data Diri</span>
          </div>
          <div className="flex-grow h-px bg-white/20 mx-4"></div>
          <div className="flex flex-col items-center opacity-40">
            <div className="w-8 h-8 bg-zinc-800 border border-white/20 rounded-full flex items-center justify-center text-white font-bold">3</div>
            <span className="text-gray-400 text-xs mt-2">Pembayaran</span>
          </div>
        </div>

        {/* Kotak Formulir */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-orange-600/20 blur-3xl rounded-full"></div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 relative z-10">Data Pemesan</h1>
          <p className="text-gray-400 text-sm mb-6 relative z-10">
            Kursi <span className="text-orange-400 font-bold">{seats.join(', ')}</span> telah diamankan. Pastikan email Anda benar untuk pengiriman E-Ticket.
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nama Lengkap (Sesuai KTP)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full pl-11 pr-3 py-3.5 border border-white/10 rounded-xl bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Masukkan nama lengkap" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Alamat Email Aktif</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-11 pr-3 py-3.5 border border-white/10 rounded-xl bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="email@contoh.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nomor WhatsApp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <input type="tel" required value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="block w-full pl-11 pr-3 py-3.5 border border-white/10 rounded-xl bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="081234567890" />
              </div>
            </div>

            <div className="pt-6">
              <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.5)] active:scale-[0.98]">
                <span>Lanjut Bayar</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TOAST COMPONENT */}
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 w-max max-w-[90vw]">
          <div className="bg-white text-black px-6 py-3 rounded-xl border-2 shadow-2xl text-sm font-bold tracking-wide whitespace-pre-line text-center" style={{ borderColor: '#bee94e' }}>
            {toastMsg}
          </div>
        </div>
      )}

      {/* MODAL ERROR COMPONENT */}
      {modalMsg && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl relative">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{modalMsg.title}</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">{modalMsg.desc}</p>
            <button onClick={() => setModalMsg(null)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold tracking-widest transition-colors uppercase">
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* POPUP KONFIRMASI DATA */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowConfirmModal(false)}
              disabled={loading}
              className="absolute top-4 right-4 text-gray-400 hover:text-white disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5 text-orange-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-xl font-bold text-white">Konfirmasi Data</h3>
              </div>
              
              <div className="bg-black/50 rounded-xl p-4 space-y-3 mb-5 border border-white/5">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nama</p>
                  <p className="text-white font-medium">{formData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-white font-medium">{formData.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">WhatsApp</p>
                  <p className="text-white font-medium">{formData.whatsapp}</p>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
                <p className="text-orange-400 text-sm leading-relaxed">
                  <strong>PENTING:</strong> Jika alamat email atau nomor salah ketik, E-Ticket Anda <strong>tidak akan terkirim</strong>. 
                  <br/><br/>
                  *Sebagai antisipasi, Anda sangat disarankan untuk langsung men-download E-Ticket pada halaman sukses setelah pembayaran.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white font-bold text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Edit Data
                </button>
                <button 
                  onClick={processCheckout}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-svara-green hover:bg-svara-green/90 text-svara-black font-bold text-sm transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-svara-black/30 border-t-svara-black rounded-full animate-spin"></span>
                  ) : (
                    "Data Sudah Benar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function FormulirPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/40">Memuat...</div>}>
      <FormulirContent />
    </Suspense>
  );
}