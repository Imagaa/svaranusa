import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Deteksi jika pengunjung menggunakan subdomain 'admin.'
  if (hostname.startsWith('admin.')) {
    // Arahkan jalurnya (rewrite) ke folder /admin secara rahasia di background
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

// Hanya jalankan untuk halaman UI, abaikan file statis/gambar
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};