'use client';

import Link from 'next/link';

export default function BeliPage() {
  const shows = [
    {
      id: 'show1',
      label: 'Show 1',
      waktu: '18.00',
      keterangan: 'Pertunjukan pertama, sesi sore hari.',
    },
    {
      id: 'show2',
      label: 'Show 2',
      waktu: '20.00',
      keterangan: 'Pertunjukan kedua, sesi malam hari.',
    },
  ];

  return (
    <div className="min-h-screen bg-svara-black">
      <div className="border-b border-svara-white/10 px-6 py-4 flex justify-between items-center sticky top-0 bg-svara-black z-10">
        <Link href="/" className="font-display text-lg text-svara-green tracking-widest">SVARANUSA</Link>
        <Link href="/" className="text-svara-white/40 text-sm hover:text-svara-white">← Beranda</Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-12 bg-svara-green" />
          <span className="text-svara-green text-xs tracking-[0.4em] uppercase">Pemilihan Show</span>
        </div>
        <h1 className="font-display text-4xl text-svara-white mb-3">Pilih Sesi<br />Pertunjukan</h1>
        <p className="text-svara-white/40 text-sm mb-12">
          Setiap sesi dijual secara terpisah. Tiket Show 1 tidak berlaku untuk Show 2, dan sebaliknya.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {shows.map(show => (
            <Link
              key={show.id}
              href={`/beli/seatmap?show=${show.id}`}
              className="group border border-svara-white/10 p-8 hover:border-svara-green transition-colors block"
            >
              <span className="text-svara-green/50 text-xs tracking-widest uppercase block mb-4">
                Svaranusa 2026
              </span>
              <h2 className="font-display text-3xl text-svara-white mb-2 group-hover:text-svara-green transition-colors">
                {show.label}
              </h2>
              <p className="text-svara-orange text-sm font-mono mb-3">{show.waktu}</p>
              <p className="text-svara-white/40 text-sm">{show.keterangan}</p>
              <div className="mt-6 flex items-center gap-2 text-svara-white/30 group-hover:text-svara-green text-xs tracking-widest uppercase transition-colors">
                <span>Pilih Kursi</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-svara-white/20 text-xs text-center mt-10">
          RRI Surakarta · Auditorium Sarsito Mangunkusumo
        </p>
      </div>
    </div>
  );
}