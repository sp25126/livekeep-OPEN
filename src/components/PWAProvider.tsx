'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { flushOfflineQueue, getOfflineQueueCount } from '@/lib/services/offlineSync';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [showSyncBanner, setShowSyncBanner] = useState<boolean>(false);

  useEffect(() => {
    // Set initial online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setOfflineCount(getOfflineQueueCount());

      // Register Service Worker
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => console.log('[PWA] Service Worker registered with scope:', reg.scope))
            .catch((err) => console.error('[PWA] Service Worker registration failed:', err));
        });
      }

      const handleOnline = async () => {
        setIsOnline(true);
        setShowSyncBanner(true);
        console.log('[PWA Sync] Internet re-established. Flushing offline queue...');
        const flushedCount = await flushOfflineQueue();
        setOfflineCount(getOfflineQueueCount());
        setTimeout(() => setShowSyncBanner(false), 5000);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setOfflineCount(getOfflineQueueCount());
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <>
      {/* Offline / Online Status Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-lg sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <WifiOff className="h-4 w-4 animate-pulse" />
            <span>Offline Mode active. Changes are queued locally and will auto-sync when online.</span>
          </div>
          {offlineCount > 0 && (
            <span className="bg-amber-800 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
              {offlineCount} Pending Voucher{offlineCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {showSyncBanner && isOnline && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center space-x-2 shadow-lg sticky top-0 z-50 animate-bounce">
          <Wifi className="h-4 w-4" />
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Connection restored! Flushing offline mutation queue to Supabase...</span>
        </div>
      )}

      {children}
    </>
  );
}
