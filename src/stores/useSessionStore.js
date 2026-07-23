// src/stores/useSessionStore.js — mvp_session_requests / mvp_sessions (email-keyed).
// Matched-coach model: requests go to the participant's assigned coach,
// who has full flexibility: accept a proposed time, suggest alternates, or decline.
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { createMeetingLink } from '../lib/meetings';
import { useAuthStore } from './useAuthStore';

export const useSessionStore = create((set, get) => ({
  myRequests: [],
  mySessions: [],
  coachQueue: [],
  coachSessions: [],
  loading: false,

  fetchMine: async () => {
    const { identity } = useAuthStore.getState();
    if (!identity) return;
    set({ loading: true });
    const [reqs, sess] = await Promise.all([
      supabase.from('mvp_session_requests').select('*')
        .eq('participant_email', identity.email).order('created_date', { ascending: false }),
      supabase.from('mvp_sessions').select('*')
        .eq('participant_email', identity.email).order('scheduled_at', { ascending: true }),
    ]);
    set({ myRequests: reqs.data ?? [], mySessions: sess.data ?? [], loading: false });
  },

  submitRequest: async ({ sessionType, topic, preferredTimes, provider }) => {
    const { identity } = useAuthStore.getState();
    const p = identity.participant;
    const { data, error } = await supabase.from('mvp_session_requests').insert({
      participant_id: p?.participant_id ?? null,
      participant_email: identity.email,
      participant_name: identity.displayName,
      coach_email: p?.assigned_coach_email ?? null,
      coach_name: p?.assigned_coach_name ?? null,
      session_type: sessionType,
      note: topic || null,
      topic: topic || null,
      preferred_times: preferredTimes,
      meeting_provider: provider,
      status: 'requested',
    }).select().single();
    if (error) return { error };
    await get().fetchMine();
    return { data };
  },

  acceptSuggestedTime: async (request, whenIso) => {
    const { error } = await supabase.from('mvp_session_requests')
      .update({ status: 'time_confirmed', preferred_times: [{ start: whenIso }] })
      .eq('id', request.id);
    if (error) throw error;
    await get().fetchMine();
  },

  cancelRequest: async (id) => {
    await supabase.from('mvp_session_requests').update({ status: 'cancelled' }).eq('id', id);
    await get().fetchMine();
  },

  // ---- Coach side ----
  fetchCoachQueue: async (..._legacyArgs) => {
    const { identity } = useAuthStore.getState();
    if (!identity) return;
    set({ loading: true });
    const [reqs, sess] = await Promise.all([
      supabase.from('mvp_session_requests').select('*')
        .eq('coach_email', identity.email)
        .in('status', ['requested', 'suggested', 'time_confirmed'])
        .order('created_date', { ascending: true }),
      supabase.from('mvp_sessions').select('*')
        .eq('coach_email', identity.email).order('scheduled_at', { ascending: true }),
    ]);
    set({ coachQueue: reqs.data ?? [], coachSessions: sess.data ?? [], loading: false });
  },

  coachAccept: async (request, whenIso) => {
    const { identity } = useAuthStore.getState();
    const meeting = await createMeetingLink({
      provider: request.meeting_provider || 'ooma',
      coachEmail: identity.email,
      topic: `GFA ${String(request.session_type || 'session').replace('_', ' ')} — ${request.participant_name || 'participant'}`,
      startsAt: whenIso,
    });
    if (meeting.needsRoomSetup) {
      // Session still gets scheduled; surface a gentle nudge to register a room.
      console.warn('No Ooma room registered yet — add one in “My meeting room”.');
    }
    const { error } = await supabase.from('mvp_sessions').insert({
      request_id: request.id,
      participant_id: request.participant_id,
      participant_email: request.participant_email,
      participant_name: request.participant_name,
      coach_email: identity.email,
      coach_name: identity.displayName,
      scheduled_at: whenIso,
      status: 'scheduled',
      meeting_provider: meeting.provider || request.meeting_provider || 'ooma',
      meeting_url: meeting.url,
    });
    if (error) throw error;
    await supabase.from('mvp_session_requests').update({ status: 'accepted' }).eq('id', request.id);
    await get().fetchCoachQueue();
  },

  coachSuggest: async (request, times, note) => {
    const { error } = await supabase.from('mvp_session_requests')
      .update({ status: 'suggested', suggested_times: times, suggest_note: note || null })
      .eq('id', request.id);
    if (error) throw error;
    await get().fetchCoachQueue();
  },

  coachDecline: async (request, note) => {
    const { error } = await supabase.from('mvp_session_requests')
      .update({ status: 'declined', suggest_note: note || null })
      .eq('id', request.id);
    if (error) throw error;
    await get().fetchCoachQueue();
  },

  completeSession: async (sessionId, coachNotes, nextStep, followUpDue) => {
    await supabase.from('mvp_sessions')
      .update({ status: 'completed', coach_notes: coachNotes ?? null, next_step: nextStep ?? null, follow_up_due: followUpDue ?? null })
      .eq('id', sessionId);
    await get().fetchCoachQueue();
  },

  submitFeedback: async ({ sessionId, role, rating, feltHeard, reflection, followUp, wantsFollowup }) => {
    const { identity } = useAuthStore.getState();
    const { error } = await supabase.from('session_feedback').insert({
      session_id: sessionId,
      author_email: identity.email,
      author_role: role,
      rating, felt_heard: feltHeard,
      reflection: reflection || null,
      follow_up_suggestion: followUp || null,
      wants_followup: !!wantsFollowup,
    });
    if (error) throw error;
  },

  // Legacy aliases used by existing components
  fetchMyRequests: async () => get().fetchMine(),

  subscribe: () => {
    const ch = supabase.channel('vrcc-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_session_requests' },
        () => { get().fetchMine(); get().fetchCoachQueue(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mvp_sessions' },
        () => { get().fetchMine(); get().fetchCoachQueue(); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  },
}));
