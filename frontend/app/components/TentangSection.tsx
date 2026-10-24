export default function TentangSection() {
  return (
    <section id="tentang" className="py-32 bg-svara-black relative overflow-hidden">
      {/* Glow dekorasi */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-svara-orange/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header section */}
        <div className="flex items-center gap-4 mb-16">
          <div className="h-px w-12 bg-svara-green" />
          <span className="text-svara-green text-xs tracking-[0.4em] uppercase">Tentang</span>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Teks kiri */}
          <div>
            <h2 className="font-display text-5xl md:text-6xl text-svara-white mb-8 leading-tight">
              Merayakan<br />
              <span className="text-svara-green">Suara</span> Nusantara
            </h2>
            <p className="text-svara-white/60 text-base leading-relaxed">
              Svaranusa adalah perayaan kekayaan budaya nusantara yang menjadi ruang temu antara bunyi dan jiwa. Di dalamnya, suara-suara tradisi tidak sekedar digaungkan; melainkan ditafsir ulang melalui proses musikal.
            </p>
          </div>

          {/* Stats kanan */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { angka: 'RRI Surakarta', label: 'Auditorium Sarsito Mangunkusumo' },
              { angka: '2 Show', label: <>Show 1 : 18.00<br/>Show 2 : 20.00</> },
              { angka: 'Memperingati Hari Anak Nasional', label: null }, // Perubahan di sini: Teks hijau panjang, label dikosongkan
              { angka: '400+', label: 'Kapasitas' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="border border-svara-white/10 p-8 hover:border-svara-green/40 transition-colors flex flex-col justify-center"
              >
                <p className={`font-display text-svara-green mb-2 leading-snug ${item.angka.length > 20 ? 'text-xl' : 'text-2xl'}`}>
                  {item.angka}
                </p>
                {item.label && (
                  <p className="text-svara-white/50 text-xs tracking-wide uppercase leading-snug">{item.label}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}