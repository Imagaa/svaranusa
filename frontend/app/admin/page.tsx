'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import axios from '@/lib/axios';
import { BarChart3, Users, QrCode, Mail, Send, CheckCircle2, XCircle, LogOut, Ticket, Camera, Link as LinkIcon, Copy, Heart, Download } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { token, user, isAuthenticated, clearAuth } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [summary, setSummary] = useState<any>(null);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]); 
  const [vipOrders, setVipOrders] = useState<any[]>([]); 
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendingDonation, setSendingDonation] = useState<string | null>(null); // State baru untuk loading resend donasi
  const [isDownloading, setIsDownloading] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  
  const [magicLink, setMagicLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [newEmail, setNewEmail] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const [showsActive, setShowsActive] = useState({ show1: true, show2: true });
  const [vipShow, setVipShow] = useState('show1');
  const [selectedVipSeats, setSelectedVipSeats] = useState<string[]>([]);
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [seatSearchQuery, setSeatSearchQuery] = useState('');
  const [isSeatDropdownOpen, setIsSeatDropdownOpen] = useState(false);
  const [vipName, setVipName] = useState('');
  const [vipEmail, setVipEmail] = useState('');
  const [vipPhone, setVipPhone] = useState('');
  const [isVipSubmitting, setIsVipSubmitting] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axios.get('/admin/summary', { headers: { Authorization: `Bearer ${token}` } }); 
      setSummary(res.data.summary || res.data);
    } catch (err) { console.error('Gagal memuat dashboard'); }
  }, [token]);

  const fetchBuyers = useCallback(async () => {
    try {
      const res = await axios.get('/admin/orders', { headers: { Authorization: `Bearer ${token}` } }); 
      setBuyers(res.data.data || res.data);
    } catch (err) { console.error('Gagal memuat data pembeli'); }
  }, [token]);

  const fetchDonors = useCallback(async () => {
    try {
      const res = await axios.get('/admin/donations', { headers: { Authorization: `Bearer ${token}` } }); 
      setDonors(res.data.data || []);
    } catch (err) { console.error('Gagal memuat data donatur'); }
  }, [token]);

  const fetchVipOrders = useCallback(async () => {
    try {
      const res = await axios.get('/admin/vip-orders', { headers: { Authorization: `Bearer ${token}` } }); 
      setVipOrders(res.data.data || res.data);
    } catch (err) { console.error('Gagal memuat data VIP'); }
  }, [token]);

  const fetchAvailableSeats = useCallback(async (show: string) => {
    try {
      const res = await axios.get(`/seat-map/seats?show=${show}`);
      const allSeats = res.data.seats || [];
      
      const availableCodes = allSeats
        .filter((seat: any) => seat.status === 'available')
        .map((seat: any) => seat.code);
      
      setAvailableSeats(availableCodes);
    } catch (e) {
      console.error('Gagal memuat daftar kursi VIP:', e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'vip') {
      fetchAvailableSeats(vipShow);
      setSelectedVipSeats([]);
      setSeatSearchQuery('');
    }
  }, [vipShow, activeTab, fetchAvailableSeats]);

  const fetchShowsStatus = useCallback(async () => {
    try {
      const [res1, res2] = await Promise.all([
        axios.get('/seat-map?show=show1'),
        axios.get('/seat-map?show=show2')
      ]);
      setShowsActive({
        show1: res1.data?.is_active ?? true,
        show2: res2.data?.is_active ?? true
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated() || !token) {
      router.push('/admin/login'); 
      return;
    }
    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSummary(), fetchBuyers(), fetchDonors(), fetchShowsStatus(), fetchVipOrders()]);
      setIsLoading(false);
    };
    loadAllData();
  }, [isAuthenticated, router, token, fetchSummary, fetchBuyers, fetchDonors, fetchShowsStatus, fetchVipOrders]);

  const handleLogout = () => {
    clearAuth();
    router.push('/admin/login');
  };

  const handleDownloadCSV = async () => {
    setIsDownloading(true);
    try {
      const res = await axios.get('/admin/orders/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Data_Pembeli_Svaranusa_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      fetchSummary();
    } catch (e: any) {
      if (e.response && e.response.data instanceof Blob) {
         const text = await e.response.data.text();
         try {
           const errData = JSON.parse(text);
           setToastMsg(errData.message);
         } catch {
           setToastMsg('Gagal mendownload data.');
         }
      } else {
         setToastMsg('Gagal mendownload data.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResend = async () => {
    setIsSending(true);
    try {
      await axios.post(`/admin/orders/${editingOrder.order_code}/resend-ticket`, {
        new_email: newEmail || editingOrder.buyer_email
      }, { headers: { Authorization: `Bearer ${token}` } });
      setToastMsg('E-Ticket berhasil dikirim ulang!');
      setEditingOrder(null);
      fetchBuyers();
    } catch (error) {
      setToastMsg('Gagal mengirim email.');
    } finally {
      setIsSending(false);
    }
  };

  // --- FUNGSI BARU: KIRIM EMAIL DONASI MANUAL ---
  const handleResendDonation = async (code: string) => {
    setSendingDonation(code);
    try {
      await axios.post(`/admin/donations/${code}/resend`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setToastMsg('Email ucapan terima kasih donasi berhasil dikirim!');
    } catch (err) {
      setToastMsg('Gagal mengirim email donasi.');
    } finally {
      setSendingDonation(null);
    }
  };

  const handleToggleShow = async (targetShow: string) => {
    try {
      const res = await axios.post(`/admin/shows/${targetShow}/toggle-status`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setShowsActive(prev => ({ ...prev, [targetShow]: res.data.is_active }));
      setToastMsg(`Status ${targetShow} berhasil diubah!`);
    } catch (e) {
      setToastMsg('Gagal mengubah status');
    }
  };

  const toggleVipSeat = (seat: string) => {
    setSelectedVipSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

  const handleSubmitVip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVipSeats.length === 0) {
      setToastMsg('Silakan pilih minimal 1 kursi terlebih dahulu.');
      return;
    }
    setIsVipSubmitting(true);
    try {
      await axios.post('/admin/vip-reservations', {
        show: vipShow,
        seats: selectedVipSeats,
        customer_name: vipName,
        customer_email: vipEmail,
        customer_phone: vipPhone,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setToastMsg('Plotting VIP berhasil! E-Ticket sedang dikirim.');
      setSelectedVipSeats([]); setVipName(''); setVipEmail(''); setVipPhone('');
      fetchSummary();
      fetchShowsStatus();
      fetchAvailableSeats(vipShow); // Refresh sisa kursi
      fetchVipOrders(); // Refresh tabel daftar VIP
    } catch (e: any) {
      setToastMsg(e.response?.data?.message || 'Gagal memplot VIP. Pastikan pendaftaran publik sudah ditutup.');
    } finally {
      setIsVipSubmitting(false);
    }
  };

  const handleRevokeVip = async (orderCode: string) => {
    if (!window.confirm(`PERINGATAN!\n\nAnda yakin ingin MENCABUT tiket VIP (${orderCode}) ini?\nKursi akan hangus dan dikembalikan menjadi kosong.`)) return;
    
    try {
      await axios.delete(`/admin/vip-orders/${orderCode}`, { headers: { Authorization: `Bearer ${token}` } });
      setToastMsg('Tiket VIP berhasil dicabut, kursi telah kosong kembali.');
      fetchVipOrders();
      fetchSummary();
      if (activeTab === 'vip') fetchAvailableSeats(vipShow);
    } catch (e) {
      setToastMsg('Gagal mencabut tiket VIP.');
    }
  };

  const processScan = async (codeToScan: string) => {
    setScanResult(null);
    try {
      const res = await axios.post('/checkin', { ticket_code: codeToScan }, { headers: { Authorization: `Bearer ${token}` } });
      setScanResult({ status: 'valid', data: res.data });
      fetchBuyers(); 
    } catch (error: any) {
      if (error.response?.status === 409) {
        setScanResult({ status: 'used', data: error.response.data });
      } else {
        const validationError = error.response?.data?.errors?.ticket_code?.[0];
        const errorMessage = validationError || error.response?.data?.message || 'Tiket tidak ditemukan / belum lunas';
        setScanResult({ status: 'invalid', message: errorMessage });
      }
    }
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if(scanCode) processScan(scanCode);
    setScanCode(''); 
  };

  const generateMagicLink = () => {
    if (!token) return;
    const encodedToken = btoa(token);
    const link = `${window.location.origin}/admin/scanner-only?k=${encodedToken}`;
    setMagicLink(link);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-orange-500 tracking-widest">ADMIN SVARANUSA</h1>
          <p className="text-gray-400 text-sm mt-1">Halo, <span className="text-white font-medium">{user?.name}</span></p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 bg-red-500/10 px-4 py-2 rounded-lg transition-colors text-sm font-bold">
          <LogOut size={16}/> Keluar
        </button>
      </div>
      
      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 whitespace-nowrap px-2 ${activeTab === 'dashboard' ? 'text-green-400 font-bold border-b-2 border-green-400 pb-4 -mb-4' : 'text-gray-500'}`}><BarChart3 size={18}/> Dashboard</button>
        <button onClick={() => setActiveTab('buyers')} className={`flex items-center gap-2 whitespace-nowrap px-2 ${activeTab === 'buyers' ? 'text-green-400 font-bold border-b-2 border-green-400 pb-4 -mb-4' : 'text-gray-500'}`}><Users size={18}/> Data Pembeli</button>
        <button onClick={() => setActiveTab('donors')} className={`flex items-center gap-2 whitespace-nowrap px-2 ${activeTab === 'donors' ? 'text-green-400 font-bold border-b-2 border-green-400 pb-4 -mb-4' : 'text-gray-500'}`}><Heart size={18}/> Daftar Donatur</button>
        <button onClick={() => setActiveTab('scanner')} className={`flex items-center gap-2 whitespace-nowrap px-2 ${activeTab === 'scanner' ? 'text-green-400 font-bold border-b-2 border-green-400 pb-4 -mb-4' : 'text-gray-500'}`}><QrCode size={18}/> Scanner</button>
        <button onClick={() => setActiveTab('vip')} className={`flex items-center gap-2 whitespace-nowrap px-2 ${activeTab === 'vip' ? 'text-green-400 font-bold border-b-2 border-green-400 pb-4 -mb-4' : 'text-gray-500'}`}><CheckCircle2 size={18}/> VIP & Kontrol</button>
      </div>

      {isLoading ? (
         <div className="animate-pulse space-y-6">
           <div className="grid md:grid-cols-4 gap-6">
             <div className="bg-zinc-900/50 border border-white/5 h-32 rounded-2xl"></div>
             <div className="bg-zinc-900/50 border border-white/5 h-32 rounded-2xl"></div>
             <div className="bg-zinc-900/50 border border-white/5 h-32 rounded-2xl"></div>
             <div className="bg-zinc-900/50 border border-white/5 h-32 rounded-2xl"></div>
           </div>
         </div>
      ) : (
        <>
          {activeTab === 'dashboard' && summary && (
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-zinc-900 border border-green-500/30 p-6 rounded-2xl">
                <p className="text-gray-400 text-sm">Realtime Revenue (Bersih)</p>
                <p className="text-3xl font-bold text-green-400 mt-2">Rp {Number(summary.total_revenue || 0).toLocaleString('id-ID')}</p>
              </div>
              
              <div className="bg-zinc-900 border border-blue-500/30 p-6 rounded-2xl">
                <p className="text-gray-400 text-sm flex items-center gap-2"><Heart size={14} className="text-blue-400"/> Total Donasi Terkumpul</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">Rp {Number(summary.total_donation || 0).toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-500 mt-2">Dari Ruang Berbagi & Lebihan Tiket</p>
              </div>

              <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl">
                <p className="text-gray-400 text-sm">Tiket Terjual / Sisa Kursi</p>
                <div className="mt-2 flex items-baseline gap-2">
                   <p className="text-3xl font-bold text-white">{summary.total_tickets || 0}</p>
                   <span className="text-sm font-normal text-gray-500">Terjual</span>
                </div>
                {summary.total_seats !== undefined && (
                   <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-sm">
                      <span className="text-gray-400">Tersedia:</span>
                      <strong className="text-green-400 bg-green-500/10 px-2 py-1 rounded">{summary.available_seats || 0} Kursi Kosong</strong>
                   </div>
                )}
              </div>
              <div className="bg-zinc-900 border border-orange-500/30 p-6 rounded-2xl">
                <p className="text-gray-400 text-sm mb-3">Distribusi Show</p>
                <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg mb-2 border border-white/5">
                  <span>Show 1 (Malam)</span><span className="font-bold text-orange-400">{summary.show1_tickets || 0} Tiket</span>
                </div>
                <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-white/5">
                  <span>Show 2 (Pagi)</span><span className="font-bold text-orange-400">{summary.show2_tickets || 0} Tiket</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buyers' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                {summary?.can_download_excel ? (
                  <button 
                    onClick={handleDownloadCSV} 
                    disabled={isDownloading || buyers.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(46,204,113,0.3)] animate-pulse"
                  >
                    {isDownloading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Download size={16}/>}
                    {isDownloading ? 'Mengunduh Excel...' : 'Download Data Excel (.xlsx)'}
                  </button>
                ) : (
                  <button 
                    disabled
                    className="bg-zinc-800 text-gray-500 border border-white/10 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-not-allowed"
                    title="Fitur ini dilimitasi. Anda hanya bisa mengunduh 1 kali dalam 12 jam."
                  >
                    <Download size={16}/> Limit: Coba lagi setelah 12 Jam
                  </button>
                )}
              </div>

              <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-black/50 text-gray-400">
                    <tr>
                      <th className="p-4">Kode Order</th>
                      <th className="p-4">Nama & Email</th>
                      <th className="p-4">Detail Tiket & Status</th>
                      <th className="p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {buyers.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada data pembeli lunas.</td></tr>
                    ) : (
                      buyers.map((b: any) => (
                        <tr key={b.order_code} className="hover:bg-white/5">
                          <td className="p-4 font-mono text-orange-400">{b.order_code}</td>
                          <td className="p-4">
                            <p className="font-bold">{b.buyer_name}</p>
                            <p className="text-gray-500 text-xs mt-1">{b.buyer_email}</p>
                          </td>
                          <td className="p-4">
                            {b.items && b.items.length > 0 ? (
                              <div className="flex flex-col gap-2 mb-3">
                                {b.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded font-mono text-xs border flex items-center gap-1 ${item.checked_in_at ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                                      {item.seat?.code || 'Seat ?'} 
                                      {item.checked_in_at && <span title="Sudah Masuk Venue"><CheckCircle2 size={12} className="text-green-500 ml-1" /></span>}
                                    </span>
                                    <span className="text-gray-400 font-mono text-xs bg-black/50 px-2 py-1 rounded border border-white/10 flex items-center gap-1 select-all cursor-pointer hover:text-white" title="Copy kode ini untuk di-scan">
                                      <Ticket size={12}/> {item.ticket_code}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs italic block mb-2">Data kursi belum sinkron...</span>
                            )}
                            <p className="text-green-400 font-mono text-xs mt-1">Total: Rp {Number(b.paid_amount || 0).toLocaleString('id-ID')}</p>
                          </td>
                          <td className="p-4">
                            <button onClick={() => { setEditingOrder(b); setNewEmail(b.buyer_email); }} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md flex items-center gap-2 transition-colors">
                              <Mail size={14}/> Edit & Resend
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'donors' && (
             <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[600px]">
                 <thead className="bg-black/50 text-gray-400">
                   <tr>
                     <th className="p-4">Nama Donatur</th>
                     <th className="p-4">Email</th>
                     <th className="p-4">Jumlah Donasi</th>
                     <th className="p-4">Sumber</th>
                     <th className="p-4">Tanggal</th>
                     <th className="p-4">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {donors.length === 0 ? (
                     <tr><td colSpan={6} className="p-8 text-center text-gray-500">Belum ada donatur yang tercatat.</td></tr>
                   ) : (
                     donors.map((d: any, idx: number) => (
                       <tr key={idx} className="hover:bg-white/5">
                         <td className="p-4 font-bold text-white">{d.name}</td>
                         <td className="p-4 text-gray-400">{d.email}</td>
                         <td className="p-4 font-mono text-blue-400 font-bold">Rp {Number(d.amount).toLocaleString('id-ID')}</td>
                         <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs ${d.source === 'Pembelian Tiket' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                             {d.source}
                           </span>
                         </td>
                         <td className="p-4 text-gray-400 text-xs">{new Date(d.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                         <td className="p-4">
                           {/* TOMBOL EMAIL KHUSUS DONATUR RUANG BERBAGI */}
                           {d.source === 'Ruang Berbagi (Website)' ? (
                             <button 
                               onClick={() => handleResendDonation(d.code)} 
                               disabled={sendingDonation === d.code}
                               className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
                             >
                               {sendingDonation === d.code ? (
                                 <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Mengirim...</>
                               ) : (
                                 <><Mail size={14}/> Kirim Email Ucapan</>
                               )}
                             </button>
                           ) : (
                             <span className="text-gray-600 text-xs italic px-3">Via E-Ticket</span>
                           )}
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          )}

          {activeTab === 'scanner' && (
            <div className="max-w-4xl bg-zinc-900 border border-white/10 p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-start">
              
              <div className="flex-1 w-full bg-black/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><LinkIcon size={18}/> Buat Link Akses Staf</h3>
                <p className="text-gray-400 text-xs mb-6 leading-relaxed">Berikan link ini ke staf penjaga pintu. Mereka bisa men-scan tiket lewat HP tanpa perlu login.</p>
                
                <button onClick={generateMagicLink} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-bold transition-colors mb-4">
                  Generate Link Scanner
                </button>

                {magicLink && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-orange-400 mb-2 italic">*Hati-hati! Link ini memiliki akses langsung ke database scanner.</p>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={magicLink} className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-xs font-mono outline-none" />
                      <button onClick={copyToClipboard} className={`px-4 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                        {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><QrCode/> Scanner Tiket Manual</h2>
                
                <div className="flex gap-2 mb-6">
                  <button onClick={() => setUseCamera(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${!useCamera ? 'bg-green-600 border-green-600 text-white' : 'border-white/20 text-gray-400 hover:bg-white/5'}`}>Ketik Manual</button>
                  <button onClick={() => setUseCamera(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold border flex items-center justify-center gap-2 transition-colors ${useCamera ? 'bg-orange-600 border-orange-600 text-white' : 'border-white/20 text-gray-400 hover:bg-white/5'}`}><Camera size={16}/> Kamera PC</button>
                </div>

                {!useCamera ? (
                  <form onSubmit={handleManualScan} className="flex gap-2 mb-6">
                    <input 
                      autoFocus type="text" value={scanCode} onChange={(e) => setScanCode(e.target.value.toUpperCase())}
                      placeholder="TIC-XXXXXXX"
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white font-mono uppercase focus:border-green-500 outline-none"
                    />
                    <button type="submit" disabled={!scanCode} className="bg-green-600 hover:bg-green-700 text-white px-6 font-bold rounded-lg disabled:opacity-50">Cek</button>
                  </form>
                ) : (
                  <div className="mb-6 rounded-xl overflow-hidden border-2 border-orange-500/50 bg-black aspect-square max-w-[250px] mx-auto">
                    <Scanner 
                      onScan={(result) => {
                        if(result && result[0]) {
                           setUseCamera(false); 
                           processScan(result[0].rawValue);
                        }
                      }}
                      formats={['qr_code']}
                      components={{ finder: true }}
                    />
                  </div>
                )}

                {scanResult && (
                  <div className={`p-5 rounded-xl border ${scanResult.status === 'valid' ? 'bg-green-500/10 border-green-500/30' : scanResult.status === 'used' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
                      {scanResult.status === 'valid' ? <CheckCircle2 className="text-green-500 w-8 h-8"/> : <XCircle className={`w-8 h-8 ${scanResult.status === 'used' ? 'text-orange-500' : 'text-red-500'}`}/>}
                      <p className={`font-bold text-lg ${scanResult.status === 'valid' ? 'text-green-500' : scanResult.status === 'used' ? 'text-orange-500' : 'text-red-500'}`}>
                        {scanResult.status === 'valid' ? 'Check-in Berhasil!' : scanResult.status === 'used' ? 'Tiket SUDAH DIGUNAKAN!' : scanResult.message}
                      </p>
                    </div>
                    {scanResult.data && (
                      <div className="text-sm text-gray-300 space-y-2 mt-2">
                        <div className="flex justify-between border-b border-white/5 pb-1"><span>Atas Nama:</span> <strong className="text-white">{scanResult.data.buyer_name}</strong></div>
                        <div className="flex justify-between items-center py-1"><span>Nomor Kursi:</span> <strong className="bg-white/10 px-3 py-1 rounded font-mono text-lg border border-white/20">{scanResult.data.seat_code}</strong></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vip' && (
            <div className="space-y-8 w-full">
              <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 w-full bg-zinc-900 border border-white/10 p-8 rounded-3xl">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-white"><LogOut size={20}/> Kontrol Pendaftaran (Kill-Switch)</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">Matikan pendaftaran publik terlebih dahulu sebelum melakukan plotting kursi VIP agar data tidak bentrok.</p>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5">
                    <div>
                      <p className="font-bold text-white">Show 1 (18:00 WIB)</p>
                      <p className={`text-xs mt-1 font-bold tracking-widest uppercase ${showsActive.show1 ? 'text-green-400' : 'text-red-400'}`}>{showsActive.show1 ? '🟢 Publik Buka' : '🔴 Publik Tutup'}</p>
                    </div>
                    <button onClick={() => handleToggleShow('show1')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${showsActive.show1 ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                      {showsActive.show1 ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5">
                    <div>
                      <p className="font-bold text-white">Show 2 (20:00 WIB)</p>
                      <p className={`text-xs mt-1 font-bold tracking-widest uppercase ${showsActive.show2 ? 'text-green-400' : 'text-red-400'}`}>{showsActive.show2 ? '🟢 Publik Buka' : '🔴 Publik Tutup'}</p>
                    </div>
                    <button onClick={() => handleToggleShow('show2')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${showsActive.show2 ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                      {showsActive.show2 ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full bg-zinc-900 border border-white/10 p-8 rounded-3xl">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-white"><Users size={20}/> Plotting Tamu VIP / Undangan</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">Daftarkan tamu tanpa payment gateway. E-Ticket akan otomatis terkirim.</p>
                
                <form onSubmit={handleSubmitVip} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Pilih Jadwal</label>
                    <select value={vipShow} onChange={(e) => setVipShow(e.target.value)} className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none">
                      <option value="show1">Show 1 (18:00 WIB)</option>
                      <option value="show2">Show 2 (20:00 WIB)</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label className="block text-xs text-gray-400 mb-1">Pilih Kursi (Hanya memunculkan kursi kosong)</label>
                    <div 
                      className="min-h-[50px] w-full bg-black border border-white/20 rounded-lg p-2 flex flex-wrap gap-2 focus-within:border-orange-500 transition-colors cursor-text" 
                      onClick={() => setIsSeatDropdownOpen(true)}
                    >
                      {selectedVipSeats.map(seat => (
                        <span key={seat} className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded font-mono text-sm flex items-center gap-2">
                          {seat}
                          <button type="button" onClick={(e) => { e.stopPropagation(); toggleVipSeat(seat); }} className="hover:text-white transition-colors focus:outline-none">&times;</button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        placeholder={selectedVipSeats.length === 0 ? "Ketik nomor kursi (cth: A1)..." : ""} 
                        value={seatSearchQuery} 
                        onChange={(e) => { setSeatSearchQuery(e.target.value); setIsSeatDropdownOpen(true); }}
                        onFocus={() => setIsSeatDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsSeatDropdownOpen(false), 200)} 
                        className="flex-1 min-w-[120px] bg-transparent text-white font-mono uppercase outline-none text-sm p-1" 
                      />
                    </div>

                    {isSeatDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto bg-zinc-800 border border-white/20 rounded-xl shadow-2xl p-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {availableSeats
                          .filter(seat => !selectedVipSeats.includes(seat) && seat.toLowerCase().includes(seatSearchQuery.toLowerCase()))
                          .map(seat => (
                            <button
                              key={seat}
                              type="button"
                              onClick={() => { toggleVipSeat(seat); setSeatSearchQuery(''); setIsSeatDropdownOpen(false); }}
                              className="bg-black border border-white/10 hover:border-green-500 hover:bg-green-500/20 hover:text-green-400 text-white font-mono text-sm py-2.5 rounded-lg transition-all"
                            >
                              {seat}
                            </button>
                        ))}
                        {availableSeats.filter(seat => !selectedVipSeats.includes(seat) && seat.toLowerCase().includes(seatSearchQuery.toLowerCase())).length === 0 && (
                          <div className="col-span-full text-center text-gray-500 text-xs py-6">
                            Kursi tidak ditemukan, sudah terjual, atau sudah Anda pilih.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nama Tamu</label>
                    <input type="text" placeholder="Nama Lengkap" value={vipName} onChange={(e) => setVipName(e.target.value)} required className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">Email</label>
                      <input type="email" placeholder="tamu@email.com" value={vipEmail} onChange={(e) => setVipEmail(e.target.value)} required className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">No WhatsApp</label>
                      <input type="text" placeholder="0812..." value={vipPhone} onChange={(e) => setVipPhone(e.target.value)} required className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={isVipSubmitting} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg mt-2 transition-colors disabled:opacity-50 tracking-widest uppercase text-sm">
                    {isVipSubmitting ? 'Memproses Plotting...' : 'Daftarkan VIP & Kirim Tiket'}
                  </button>
                </form>
              </div>
            </div>

            {/* TABEL DAFTAR TAMU VIP */}
            <div className="mt-8 bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden overflow-x-auto p-2 sm:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white px-4 sm:px-0"><Ticket size={20}/> Daftar Tamu VIP & Undangan</h2>
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-black/50 text-gray-400">
                  <tr>
                    <th className="p-4">Kode Order</th>
                    <th className="p-4">Nama & Email</th>
                    <th className="p-4">Kursi & Jadwal</th>
                    <th className="p-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vipOrders.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Belum ada daftar tamu VIP.</td></tr>
                  ) : (
                    vipOrders.map((b: any) => (
                      <tr key={b.order_code} className="hover:bg-white/5">
                        <td className="p-4 font-mono text-purple-400">{b.order_code}</td>
                        <td className="p-4">
                          <p className="font-bold text-white">{b.buyer_name}</p>
                          <p className="text-gray-500 text-xs mt-1">{b.buyer_email}</p>
                          <p className="text-gray-500 text-xs">{b.buyer_phone}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {b.items?.map((item: any, idx: number) => (
                              <span key={idx} className={`px-2 py-1 rounded font-mono text-xs border flex items-center gap-1 ${item.checked_in_at ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}>
                                {item.seat?.code || 'Seat ?'} 
                                {item.checked_in_at && <CheckCircle2 size={12} className="text-green-500 ml-1" />}
                              </span>
                            ))}
                          </div>
                          <span className="text-gray-500 text-xs bg-black/50 px-2 py-1 rounded">
                            {b.items?.[0]?.seat?.seatMap?.show_identifier === 'show1' ? 'Show 1 (18:00)' : 'Show 2 (20:00)'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingOrder(b); setNewEmail(b.buyer_email); }} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md flex items-center gap-2 transition-colors">
                              <Mail size={14}/> Resend
                            </button>
                            <button onClick={() => handleRevokeVip(b.order_code)} className="text-xs bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white px-3 py-2 rounded-md flex items-center gap-2 transition-colors">
                              <XCircle size={14}/> Cabut
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </>
      )}

      {editingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-white">Kirim Ulang Tiket</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">Apakah ada kesalahan penulisan (typo) email?</p>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full bg-black border border-white/20 focus:border-orange-500 rounded-lg px-4 py-3 text-white mb-8 mt-2 outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setEditingOrder(null)} disabled={isSending} className="flex-1 border border-white/20 py-3 rounded-lg text-sm font-bold text-gray-300">Batal</button>
              <button onClick={handleResend} disabled={isSending || !newEmail} className="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded-lg text-sm font-bold flex justify-center items-center gap-2 text-white">
                {isSending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Kirim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENT TOAST MELAYANG */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 w-max max-w-[90vw]">
          <div className="bg-white text-black px-6 py-3 rounded-xl border-2 shadow-2xl text-sm font-bold tracking-wide text-center" style={{ borderColor: '#ea580c' }}>
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}