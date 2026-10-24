'use client';

import { useEffect, useRef, useState } from 'react';

export type SeatStatus = 'reserved' | 'paid' | 'available' | 'locked' | 'sold';
export type SeatStatusMap = Record<string, SeatStatus>;

interface UseSeatStatusReturn {
  statusMap: SeatStatusMap;
  isLoading: boolean;
  isConnected: boolean;
  isServerError: boolean;
  isClosed: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export function useSeatStatus(show?: string): UseSeatStatusReturn {
  const [statusMap, setStatusMap]     = useState<SeatStatusMap>({});
  const [isLoading, setIsLoading]     = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isServerError, setIsServerError] = useState(false);
  const [isClosed, setIsClosed]       = useState(false);
  const echoRef = useRef<any>(null);

  useEffect(() => {
    setIsLoading(true);
    
    const timestamp = new Date().getTime();
    const urlSeats = show ? `${API_URL}/seats/status?show=${show}&t=${timestamp}` : `${API_URL}/seats/status?t=${timestamp}`;
    const urlMap   = show ? `${API_URL}/seat-map?show=${show}&t=${timestamp}` : `${API_URL}/seat-map?t=${timestamp}`;

    setIsServerError(false);

    Promise.all([
      fetch(urlSeats, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }).then(async (res) => {
        if (!res.ok && res.status >= 500) throw new Error('Server Down');
        return res.json();
      }),
      fetch(urlMap, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }).then(res => res.json())
    ])
      .then(([dataStatus, dataMap]) => {
        setStatusMap(dataStatus.seats ?? {});
        setIsClosed(dataMap.is_active === false);
        setIsServerError(false);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Gagal mengambil status:', err);
        setIsServerError(true);
        setIsLoading(false);
      });
  }, [show]);

  // 2. Subscribe realtime via Laravel Reverb
  useEffect(() => {
    let cancelled = false;

    import('@/lib/echo').then(({ getEcho }) => {
      return getEcho();
    }).then((echo) => {
      if (cancelled) return;
      echoRef.current = echo;

      echo.connector.pusher.connection.bind('connected', () => setIsConnected(true));
      echo.connector.pusher.connection.bind('disconnected', () => setIsConnected(false));

      if (echo.connector.pusher.connection.state === 'connected') {
        setIsConnected(true);
      }

      echo.channel('seats').listen('.SeatStatusUpdated', (data: {
        seats: { seat_code: string; status: SeatStatus }[]
      }) => {
        setStatusMap(prev => {
          const next = { ...prev };
          data.seats.forEach(({ seat_code, status }) => {
            if (status === 'available') {
              delete next[seat_code];
            } else {
              next[seat_code] = status;
            }
          });
          return next;
        });
      });
    }).catch((err) => {
      console.warn('Reverb tidak tersambung:', err);
      setIsConnected(false);
    });

    return () => {
      cancelled = true;
      echoRef.current?.leave('seats');
    };
  }, [show]);

  return { statusMap, isLoading, isConnected, isServerError, isClosed };
}