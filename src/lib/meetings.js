// lib/meetings.js — one link, every kind of gathering.
// Primary provider: OOMA OFFICE. Each coach registers one reusable Ooma
// Meetings room (coach_meeting_rooms); that single link hosts 1:1 coaching,
// group coaching, recovery meetings, workshops, trainings, resource
// navigation, and needs-assessment visits. Zoom is available as a secondary
// provider when its API secrets are configured on the Edge Function.
import { supabase } from './supabaseClient';

export async function createMeetingLink({ provider = 'ooma', coachEmail, topic, startsAt, durationMin = 50 }) {
  try {
    const { data, error } = await supabase.functions.invoke('create-meeting', {
      body: { provider, coachEmail, topic, startsAt, durationMin },
    });
    if (!error && data?.url) return { url: data.url, provider: data.provider || provider, roomLabel: data.roomLabel };
    if (data?.needsRoomSetup) return { url: null, provider, needsRoomSetup: true };
  } catch { /* fall through */ }
  // Direct fallback: read the coach's registered room straight from the table
  if (coachEmail) {
    const { data: room } = await supabase.from('coach_meeting_rooms')
      .select('room_url, room_label, provider')
      .ilike('coach_email', coachEmail).eq('is_active', true).maybeSingle();
    if (room?.room_url) return { url: room.room_url, provider: room.provider, roomLabel: room.room_label };
  }
  return { url: null, provider, needsRoomSetup: true };
}

/** Google Calendar quick-add link */
export function calendarLink({ title, startsAt, durationMin = 50, url }) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMin * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: url ? `Join: ${url}\n\nNo Fees. No Stigma. Just Grace.` : 'No Fees. No Stigma. Just Grace.',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export const PROVIDER_LABELS = { ooma: 'Ooma Office', zoom: 'Zoom', uma: 'Ooma Office' };
export const providerLabel = (p) => PROVIDER_LABELS[p] || 'video';
