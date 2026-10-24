'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function RuangBerbagiPage() {
  const router = useRouter();

  const [form, setForm]             = useState({ nama: '', email: '', whatsapp: '' });
  const [nominal, setNominal]       = useState('');
  const [nominalError, setNominalError] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const MIN_NOMINAL = 5000;

  const normalizePhone = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('0')) return '62' + digits.slice(1);
    if (digits.startsWith('62')) return digits;
    return '62' + digits;
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setNominal(raw);
    setNominalError(
      raw && Number(raw) < MIN_NOMINAL
        ? `Minimal donasi Rp ${MIN_NOMINAL.toLocaleString('id-ID')}`
        : ''
    );
  };

  const nominalNum = Number(nominal);
  const isValid =
    form.nama.trim() &&
    form.email.trim() &&
    form.whatsapp.trim() &&
    nominalNum >= MIN_NOMINAL &&
    !nominalError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError('');

    const phone = normalizePhone(form.whatsapp);
    if (!/^62[0-9]{9,13}$/.test(phone)) {
      setError('Nomor WhatsApp tidak valid. Gunakan format 08xxx atau 628xxx.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name:  form.nama,
          donor_email: form.email,
          donor_phone: phone,
          amount:      nominalNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Gagal membuat donasi. Silakan coba lagi.');
        setLoading(false);
        return;
      }

      // Redirect ke halaman payment donasi
      const params = new URLSearchParams({
        donation_code: data.donation_code,
        nama:          form.nama,
        email:         form.email,
        amount:        String(nominalNum),
      });
      router.push(`/ruang-berbagi/payment?${params}`);

    } catch {
      setError('Gagal menghubungi server. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-svara-black">
      {/* Header */}
      <div className="border-b border-svara-white/10 px-6 py-4 flex justify-between items-center sticky top-0 bg-svara-black z-10">
        <Link href="/" className="font-display text-lg text-svara-green tracking-widest">SVARANUSA</Link>
        <Link href="/" className="text-svara-white/40 text-sm hover:text-svara-white">← Kembali</Link>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Judul & deskripsi */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-12 bg-svara-orange" />
          <span className="text-svara-orange text-xs tracking-[0.4em] uppercase">Ruang Berbagi</span>
        </div>
        <h1 className="font-display text-4xl text-svara-white mb-4">Ruang Berbagi<br />Svaranusa</h1>
        
        <div className="text-svara-white/50 text-sm leading-relaxed mb-10 space-y-4">
          <p>
            Ruang berbagi adalah ruang terbuka bagi siapa saja yang ingin terlibat melestarikan warisan luhur budaya dan tradisi Indonesia; Melalui Svaranusa.
          </p>
          <p>
            Setiap kontribusi, berapapun nominalnya; akan digunakan sepenuhnya untuk mendukung proses artistik dan produksi acara ini.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nominal custom */}
          <div>
            <label className="text-svara-white/60 text-xs tracking-widest uppercase block mb-2">
              Nominal Donasi
            </label>
            <input
              type="text" inputMode="numeric"
              value={nominal ? `Rp ${Number(nominal).toLocaleString('id-ID')}` : ''}
              onChange={handleNominalChange}
              placeholder="Rp 0"
              className="w-full bg-svara-white/5 border border-svara-white/10 text-svara-white px-4 py-3 text-sm focus:outline-none focus:border-svara-orange transition-colors"
            />
            {nominalError && <p className="text-red-400 text-xs mt-1">{nominalError}</p>}
          </div>

          {/* Data diri */}
          {([
            { key: 'nama',      label: 'Nama Lengkap',  type: 'text',  placeholder: 'Nama Anda' },
            { key: 'email',     label: 'Email',         type: 'email', placeholder: 'untuk bukti donasi' },
            { key: 'whatsapp',  label: 'No. WhatsApp',  type: 'tel',   placeholder: '08xxxxxxxxxx' },
          ] as const).map(field => (
            <div key={field.key}>
              <label className="text-svara-white/60 text-xs tracking-widest uppercase block mb-2">{field.label}</label>
              <input
                type={field.type} required
                value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full bg-svara-white/5 border border-svara-white/10 text-svara-white px-4 py-3 text-sm focus:outline-none focus:border-svara-orange transition-colors"
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full bg-svara-orange text-svara-black py-4 font-semibold tracking-widest uppercase text-sm hover:bg-svara-orange/90 transition-colors mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-svara-black/30 border-t-svara-black rounded-full animate-spin" />
                  Memproses...
                </span>
              : `Lanjut ke Pembayaran →`
            }
          </button>
        </form>

        <p className="text-svara-white/20 text-xs text-center mt-6 leading-relaxed">
          Pembayaran diproses melalui Midtrans. Data Anda aman dan hanya digunakan untuk keperluan administrasi acara.
        </p>
      </div>
    </div>
  );
}