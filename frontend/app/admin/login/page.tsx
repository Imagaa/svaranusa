'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import axios from '@/lib/axios';
import { Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post('/auth/login', { email, password });
      
      // Keamanan Ekstra: Tolak jika yang login bukan admin
      if (res.data.user.role !== 'admin') {
        setError('Akses ditolak. Akun ini tidak memiliki hak akses Admin.');
        setIsLoading(false);
        return;
      }

      // Simpan token ke LocalStorage khusus subdomain admin
      setAuth(res.data.user, res.data.token);
      
      // Redirect ke dashboard admin utama
      router.push('/'); 
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kredensial salah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Efek Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-16 w-32 h-32 bg-orange-600/20 blur-3xl rounded-full"></div>
        
        <div className="relative z-10">
          <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-orange-500 w-6 h-6" />
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center tracking-widest mb-1">SVARANUSA ADMIN</h1>
          <p className="text-gray-500 text-sm text-center mb-8">Silakan masuk menggunakan akun internal</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Email Admin</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="admin@sandhyakalacitrabudaya.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg text-center">{error}</div>}

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-sm transition-colors disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}