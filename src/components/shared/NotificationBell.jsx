// components/shared/NotificationBell.jsx — production notifications table.
import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { useAuthStore } from '../../stores/useAuthStore';

export default function NotificationBell() {
  const profile = useAuthStore((s) => s.profile);
  const { items, unread, fetch, markAllRead, subscribe } = useNotificationStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetch();
    return subscribe();
  }, [profile?.id]);

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open && unread) markAllRead(); }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}
        className="relative min-h-[48px] min-w-[48px] rounded-xl border border-moss-700 text-xl">
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-spore-500 text-moss-950 text-xs font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-2xl border border-moss-700 bg-moss-950 shadow-glow z-50 p-2"
          role="region" aria-label="Notifications">
          {items.length === 0 && <p className="p-4 text-moss-300 text-sm">Quiet for now 🌿</p>}
          {items.map((n) => (
            <div key={n.notification_id} className={`p-3 rounded-xl ${n.is_read ? '' : 'bg-moss-900/70'}`}>
              <p className="text-spore-100 font-medium text-sm">{n.subject}</p>
              {n.body && <p className="text-moss-300 text-sm mt-1">{n.body}</p>}
              <p className="text-moss-500 text-xs mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
