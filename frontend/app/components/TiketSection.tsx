import Link from 'next/link';

const tiers = [
  {
    seat: 'Seat A',
    harga: 'Rp 50.000',
    qty: '112 kursi tersedia',
    warna: 'border-svara-gold',
    badge: 'PREMIUM',
    badgeColor: 'bg-svara-gold text-svara-black',
    hargaColor: 'text-svara-gold',
  },
  {
    seat: 'Seat B',
    harga: 'Rp 40.000',
    qty: '152 kursi tersedia',
    warna: 'border-svara-green',
    badge: 'TERPOPULER',
    badgeColor: 'bg-svara-green text-svara-black',
    hargaColor: 'text-svara-green',
  },
  {
    seat: 'Seat C',
    harga: 'Rp 25.000',
    qty: '99 kursi tersedia',
    warna: 'border-svara-white/10',
    badge: null,
    badgeColor: '',
    hargaColor: 'text-svara-white',
  },
  {
    seat: 'Seat D',
    harga: 'Rp 25.000',
    qty: '98 kursi tersedia',
    warna: 'border-svara-white/10',
    badge: null,
    badgeColor: '',
    hargaColor: 'text-svara-white',
  },
];

export default function TiketSection() {
  return (
    <section id="tiket" className="py-32 bg-svara-black border-t border-svara-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-svara-orange/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-12 bg-svara-green" />
          <span className="text-svara-green text-xs tracking-[0.4em] uppercase">Tiket</span>
        </div>
        <h2 className="font-display text-5xl md:text-6xl text-svara-white mb-4">
          Pilih<br />Tempatmu
        </h2>
        <p className="text-svara-white/40 text-sm mb-16 max-w-md">
          Tiket terbatas. Amankan tempatmu sekarang sebelum kehabisan.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.seat}
              className={`border ${tier.warna} p-8 relative flex flex-col hover:bg-svara-white/3 transition-colors`}
            >
              {/* Badge */}
              {tier.badge && (
                <span className={`absolute -top-3 left-6 text-xs px-3 py-1 tracking-widest font-semibold ${tier.badgeColor}`}>
                  {tier.badge}
                </span>
              )}

              <div className="mb-6">
                <p className="text-svara-white/40 text-xs tracking-widest uppercase mb-3">Program Tiket</p>
                <h3 className="font-display text-3xl text-svara-white mb-4">{tier.seat}</h3>
                <p className={`text-2xl font-semibold ${tier.hargaColor} mb-2`}>
                  {tier.harga}
                </p>
                <p className="text-svara-white/30 text-xs tracking-widest">{tier.qty}</p>
              </div>

              <div className="mt-auto">
                {/* fix: hapus dead code komentar //href="/auth/login" */}
                <Link
                  href="/beli"
                  className={`block text-center py-3 text-sm tracking-widest uppercase font-semibold transition-colors
                    ${tier.badge === 'TERPOPULER'
                      ? 'bg-svara-green text-svara-black hover:bg-svara-green/90'
                      : 'border border-svara-white/20 text-svara-white hover:border-svara-white/50'}`}
                >
                  Beli Sekarang
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-svara-white/20 text-xs text-center mt-8 tracking-widest">
          * HARGA BELUM TERMASUK BIAYA LAYANAN
        </p>
      </div>
    </section>
  );
}
