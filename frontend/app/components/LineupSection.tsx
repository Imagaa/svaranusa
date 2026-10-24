export default function LineupSection() {
  const lineup = [
    { nama: 'GISTARA musik',            genre: 'Choir & Band', hari: 'Performer' },
    { nama: 'SAKECA ansamble',          genre: 'Orkestra',     hari: 'Performer' },
    { nama: 'Anjar Widyarosadi, M. Sn.',genre: 'Produser',     hari: 'Dibalik Layar' },
    { nama: 'Antonia Filicia Esa Rindi',genre: 'Director',     hari: 'Dibalik Layar' },
    { nama: 'Pradipta Bagaskara',       genre: 'Music Arr.',   hari: 'Dibalik Layar' },
    { nama: 'Agustina Rini',            genre: 'Choir Arr.',   hari: 'Dibalik Layar' },
  ];

  return (
    <section id="lineup" className="py-32 bg-svara-black border-t border-svara-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-96 h-64 bg-svara-green/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-12 bg-svara-green" />
          <span className="text-svara-green text-xs tracking-[0.4em] uppercase">Formasi Artistik</span>
        </div>
        <h2 className="font-display text-5xl md:text-6xl text-svara-white mb-16">
          Para Pengisi<br />Panggung
        </h2>

        {/* Grid artis */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-svara-white/5">
          {lineup.map((artis) => (
            <div
              key={artis.nama}
              className="bg-svara-black p-8 group hover:bg-svara-white/5 transition-colors cursor-pointer"
            >
              <span className="text-svara-green/50 text-xs tracking-widest uppercase mb-4 block">
                {artis.hari}
              </span>
              <h3 className={`font-display text-svara-white mb-2 group-hover:text-svara-green transition-colors ${
                  artis.nama.length > 22 
                    ? 'text-sm sm:text-base md:text-lg lg:text-xl whitespace-nowrap' 
                    : 'text-2xl'
                }`}>
                {artis.nama}
              </h3>
              <p className="text-svara-white/40 text-sm">{artis.genre}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}