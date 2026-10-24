let echoInstance: any = null;

export async function getEcho(): Promise<any> {
  if (echoInstance) return echoInstance;

  if (typeof window === 'undefined') {
    throw new Error('getEcho() hanya bisa dipanggil di sisi client');
  }

  const [{ default: Pusher }, { default: Echo }] = await Promise.all([
    import('pusher-js'),
    import('laravel-echo'),
  ]);

  echoInstance = new Echo({
    broadcaster:       'reverb',
    key:               process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost:            process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort:            Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort:           Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS:          (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    // Hapus pembuatan client manual, biarkan Echo yang mengaturnya dengan konfigurasi utama
  });

  return echoInstance;
}