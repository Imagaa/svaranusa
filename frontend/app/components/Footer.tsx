import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-svara-black border-t border-svara-white/10 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <p className="font-display text-2xl text-svara-green tracking-widest mb-4">SVARANUSA</p>
            <p className="text-svara-white/40 text-sm leading-relaxed">
              Perayaan kekayaan budaya nusantara — ruang temu antara bunyi dan jiwa.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-svara-white/60 text-xs tracking-widest uppercase mb-4">Navigasi</p>
            <ul className="space-y-3">
              {[
                { label: 'Tentang',           href: '/#tentang' },
                { label: 'Formasi Artistik',  href: '/#lineup'  },
                { label: 'Tiket',             href: '/#tiket'   },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-svara-white/40 text-sm hover:text-svara-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <p className="text-svara-white/60 text-xs tracking-widest uppercase mb-4">Kontak</p>
            <ul className="space-y-3">
              <li className="text-svara-white/40 text-sm">
                <span className="text-svara-white/60">Contact Person</span><br />
                Priskila Winnie<br />
                <a
                  href="https://wa.me/6281333899636"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-svara-white transition-colors"
                >
                  +62 813-3389-9636
                </a>
              </li>
              <li className="text-svara-white/40 text-sm">
                <a
                  href="https://instagram.com/svaranusa.official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-svara-white transition-colors"
                >
                  @svaranusa.official
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-svara-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-svara-white/20 text-xs tracking-widest">
            © 2026 SVARANUSA. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            <span className="text-svara-white/20 text-xs cursor-default">Kebijakan Privasi</span>
            <span className="text-svara-white/20 text-xs cursor-default">Syarat & Ketentuan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
