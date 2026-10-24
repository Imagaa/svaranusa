'use client';

import { useAuthStore } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';


export default function DashboardPage() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/auth/login');
  }, []);

  return (
    <div className="min-h-screen bg-svara-black">
      {/* Topbar */}
      <div className="border-b border-svara-white/10 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="font-display text-lg text-svara-green tracking-widest">SVARANUSA</Link>
        <div className="flex items-center gap-6">
          <span className="text-svara-white/50 text-sm">{user?.name}</span>
          <button
            onClick={() => { clearAuth(); router.push('/'); }}
            className="text-svara-white/30 text-xs hover:text-svara-white transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-svara-white mb-2">Halo, {user?.name?.split(' ')[0]}</h1>
        <p className="text-svara-white/40 text-sm mb-12">Selamat datang di dashboard Svaranusa</p>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/dashboard/tiket" className="border border-svara-white/10 p-8 hover:border-svara-green/40 transition-colors group">
            <p className="text-svara-green text-3xl mb-4">🎫</p>
            <h2 className="font-display text-xl text-svara-white mb-2 group-hover:text-svara-green transition-colors">Tiket Saya</h2>
            <p className="text-svara-white/40 text-sm">Lihat dan download tiket yang sudah dibeli</p>
          </Link>
          {/* fix: was /tiket — route yang benar adalah /beli */}
          <Link href="/beli" className="border border-svara-green bg-svara-green/5 p-8 hover:bg-svara-green/10 transition-colors group">
            <p className="text-svara-green text-3xl mb-4">🛒</p>
            <h2 className="font-display text-xl text-svara-white mb-2">Beli Tiket</h2>
            <p className="text-svara-white/40 text-sm">Pilih seat dan selesaikan pembelian</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
