/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // fix: daftarkan domain Midtrans agar Image component tidak error
    // (saat ini pakai unoptimized=true sebagai workaround, ini solusi yang proper)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.sandbox.midtrans.com',
      },
      {
        protocol: 'https',
        hostname: 'api.midtrans.com',
      },
      {
        protocol: 'https',
        hostname: 'payment.midtrans.com',
      },
    ],
  },
};

export default nextConfig;
