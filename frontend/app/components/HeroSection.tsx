import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative h-[100dvh] min-h-[100dvh] flex items-center justify-center overflow-hidden bg-svara-black pt-16">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-svara-green/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-svara-orange/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#F2F2F2 1px, transparent 1px), linear-gradient(90deg, #F2F2F2 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-svara-green" />
          <p className="text-svara-green text-xs tracking-[0.4em] uppercase font-body">
            Festival Musik Nusantara
          </p>
          <div className="h-px w-16 bg-svara-green" />
        </div>

        {/* Gambar Logo Hero */}
        <div className="flex justify-center mb-8">
          <Image 
            src="/svaranusa-logo.webp" 
            alt="Svaranusa Logo" 
            width={800} 
            height={250} 
            className="w-[80vw] max-w-2xl object-contain drop-shadow-2xl" 
            priority 
          />
        </div>

        <div className="flex items-center justify-center gap-6 mb-10 text-svara-white/40 text-sm tracking-widest uppercase">
          <span>2026</span>
          <span className="w-1 h-1 rounded-full bg-svara-white/40" />
          <span>Surakarta</span>
          <span className="w-1 h-1 rounded-full bg-svara-white/40" />
          <span>Jawa Tengah</span>
        </div>

        {/* Urutan: Formasi Artistik — Beli Tiket — Ruang Berbagi */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/#lineup"
            className="border border-svara-white/20 text-svara-white px-10 py-3.5 text-sm tracking-widest uppercase hover:border-svara-green hover:text-svara-green transition-colors"
          >
            Formasi Artistik
          </Link>
          <Link
            href="/beli"
            className="bg-svara-green text-svara-black px-10 py-3.5 font-semibold text-sm tracking-widest uppercase hover:bg-svara-green/90 transition-colors"
          >
            Beli Tiket
          </Link>
          <Link
            href="/ruang-berbagi"
            className="border border-svara-orange/40 text-svara-orange/80 px-10 py-3.5 text-sm tracking-widest uppercase hover:border-svara-orange hover:text-svara-orange transition-colors"
          >
            Ruang Berbagi
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-svara-white/30 text-xs tracking-widest">SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-svara-white/30 to-transparent" />
      </div>
    </section>
  );
}