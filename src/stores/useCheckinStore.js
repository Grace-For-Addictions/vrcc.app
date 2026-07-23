// src/stores/useCheckinStore.js — Morning → daily_pulse · Evening → daily_cultivations.
// Offline-first: writes queue in IndexedDB and sync idempotently via client_uuid.
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { queueCheckin, drainQueue } from '../lib/offlineQueue';
import { useAuthStore } from './useAuthStore';

const today = () => new Date().toISOString().slice(0, 10);

export const useCheckinStore = create((set, get) => ({
  today: { morning: null, evening: null },
  trends: [],        // v_mycelium_trends rows (30 days)
  syncing: false,

  fetchToday: async (..._legacy) => {
    const pid = useAuthStore.getState().participantId();
    if (!pid) return;
    const [pulse, cult] = await Promise.all([
      supabase.from('daily_pulse').select('*').eq('participant_id', pid).eq('pulse_date', today()).maybeSingle(),
      supabase.from('daily_cultivations').select('*').eq('participant_id', pid).eq('cultivation_date', today()).maybeSingle(),
    ]);
    set({ today: { morning: pulse.data ?? null, evening: cult.data ?? null } });
  },

  fetchTrends: async (..._legacy) => {
    const pid = useAuthStore.getState().participantId();
    if (!pid) return;
    const { data } = await supabase.from('v_mycelium_trends')
      .select('*').eq('participant_id', pid).order('day', { ascending: true });
    set({ trends: data ?? [] });
  },

  /** Accepts (kind, payload) or a single legacy payload object with .kind */
  saveCheckin: async (kindOrPayload, maybePayload) => {
    const kind = typeof kindOrPayload === 'string' ? kindOrPayload : kindOrPayload.kind;
    const raw = typeof kindOrPayload === 'string' ? (maybePayload || {}) : kindOrPayload;
    // Map legacy component field names → store fields
    const payload = {
      ...raw,
      intention: raw.intention ?? raw.intention_text,
      voiceNoteUrl: raw.voiceNoteUrl ?? raw.intention_audio_url,
      bdnfPrompt: raw.bdnfPrompt ?? raw.movement_prompt,
      movementCommitted: raw.movementCommitted ?? raw.movement_done,
      barcPulse: raw.barcPulse ?? raw.barc_pulse,
      coachVisible: raw.coachVisible ?? raw.coach_visible,
    };
    const pid = useAuthStore.getState().participantId();
    if (!pid) throw new Error('No participant profile yet — complete intake first.');
    const client_uuid = payload.client_uuid || crypto.randomUUID();

    const record = kind === 'morning'
      ? {
          table: 'daily_pulse', conflict: 'client_uuid',
          row: {
            client_uuid, participant_id: pid, pulse_date: today(),
            intention_text: payload.intention || null,
            voice_note_url: payload.voiceNoteUrl || null,
            bdnf_prompt: payload.bdnfPrompt || null,
            movement_committed: !!payload.movementCommitted,
            exercise_today: !!payload.movementCommitted,
            mood_score: payload.mood ?? null,
            gratitude_note: payload.gratitude || null,
            coach_visible: !!payload.coachVisible,
            check_in_method: 'vrcc-quantum',
          },
        }
      : {
          table: 'daily_cultivations', conflict: 'client_uuid',
          row: {
            client_uuid, participant_id: pid, cultivation_date: today(),
            grow_goal: payload.grow_goal || null,
            grow_reality: payload.grow_reality || null,
            grow_options: payload.grow_options || null,
            grow_will: payload.grow_will || null,
            barc_pulse: payload.barcPulse ?? null,
            thankful_in_control: payload.gratitude || null,
            declaration: payload.declaration || null,
            practice_completed: true,
            coach_visible: !!payload.coachVisible,
            slogan_delivered_by: 'vrcc_quantum',
          },
        };

    if (!navigator.onLine) {
      await queueCheckin(record);
      set((s) => ({ today: { ...s.today, [kind]: record.row } }));
      return { queued: true };
    }
    const { error } = await supabase.from(record.table).upsert(record.row, { onConflict: record.conflict });
    if (error) { await queueCheckin(record); return { queued: true }; }
    await get().fetchToday();
    return { queued: false };
  },

  setCoachVisible: async (kind, visible) => {
    const row = get().today[kind];
    if (!row?.id) return;
    const table = kind === 'morning' ? 'daily_pulse' : 'daily_cultivations';
    await supabase.from(table).update({ coach_visible: visible }).eq('id', row.id);
    await get().fetchToday();
  },

  uploadVoiceNote: async (a, b) => {
    const blob = b ?? a; // accepts (id, blob) legacy or (blob)
    const { identity } = useAuthStore.getState();
    const path = `${identity.userId}/${Date.now()}.webm`;
    const { error } = await supabase.storage.from('voice-notes').upload(path, blob, { contentType: 'audio/webm' });
    if (error) throw error;
    const { data } = supabase.storage.from('voice-notes').getPublicUrl(path);
    return data.publicUrl;
  },

  syncOffline: async () => {
    set({ syncing: true });
    await drainQueue(async (record) => {
      const { error } = await supabase.from(record.table).upsert(record.row, { onConflict: record.conflict });
      if (error) throw error;
    });
    set({ syncing: false });
    await get().fetchToday();
  },
}));
