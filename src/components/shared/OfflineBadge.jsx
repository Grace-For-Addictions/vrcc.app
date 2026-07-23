// src/components/shared/OfflineBadge.jsx
import { useEffect, useState } from 'react';
import { useCheckinStore } from '../../stores/useCheckinStore';

export default function OfflineBadge() {
  const [online, setOnline] = useState(navigator.onLine);
  const pending = useCheckinStore((s) => s.offlinePending);
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  if (online && !pending) return null;
  return (
    <div role="status" className="fixed bottom-4 inset-x-4 sm:left-auto sm:w-96 rounded-2xl bg-moss-800 border border-lichen-500/40 p-4 text-moss-100 shadow-xl z-50">
      {online
        ? `Syncing ${pending} saved check-in${pending === 1 ? '' : 's'}…`
        : "You're offline — everything you save is kept safe on this device and will sync automatically. 🌾"}
    </div>
  );
}
