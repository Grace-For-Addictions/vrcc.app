// src/stores/useNotificationStore.js — production `notifications` table
// (participant_id-keyed, subject/body, is_read).
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

export const useNotificationStore = create((set, get) => ({
  items: [],
  unread: 0,

  fetch: async () => {
    const pid = useAuthStore.getState().participantId();
    if (!pid) return;
    const { data } = await supabase.from('notifications')
      .select('notification_id, subject, body, notification_type, is_read, created_at, linked_entity_type')
      .eq('participant_id', pid).eq('is_deleted', false)
      .order('created_at', { ascending: false }).limit(30);
    const items = data ?? [];
    set({ items, unread: items.filter((n) => !n.is_read).length });
  },

  markAllRead: async () => {
    const pid = useAuthStore.getState().participantId();
    if (!pid) return;
    await supabase.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('participant_id', pid).eq('is_read', false);
    await get().fetch();
  },

  subscribe: () => {
    const ch = supabase.channel('vrcc-notify')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => get().fetch())
      .subscribe();
    return () => supabase.removeChannel(ch);
  },
}));
