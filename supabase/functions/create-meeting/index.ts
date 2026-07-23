// create-meeting — DEPLOYED to project ykykeioydvtxpyreshhs (v2, ACTIVE).
// Primary provider: OOMA OFFICE. Ooma Meetings rooms are reusable personal
// rooms (no public ad-hoc creation API), so each coach registers their room
// once in `coach_meeting_rooms` and this function hands it out per session.
// One room serves every purpose: 1:1 coaching, group coaching, recovery
// meetings, workshops, trainings, resource navigation, needs assessments.
// Optional secondary: ZOOM (set ZOOM_ACCOUNT_ID/CLIENT_ID/CLIENT_SECRET).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function zoomMeeting(topic?: string, startsAt?: string, durationMin = 50) {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
  if (!accountId || !clientId || !clientSecret) return null;
  const tokenRes = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: 'POST', headers: { Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}` } },
  );
  const { access_token } = await tokenRes.json();
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: topic ?? 'GFA session', type: startsAt ? 2 : 1, start_time: startsAt, duration: durationMin,
      settings: { waiting_room: true, join_before_host: false },
    }),
  });
  const m = await res.json();
  return m.join_url ? { url: m.join_url, provider: 'zoom' } : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { provider = 'ooma', coachEmail, topic, startsAt, durationMin } = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    if (provider === 'zoom') {
      const zoom = await zoomMeeting(topic, startsAt, durationMin);
      if (zoom) return json(zoom);
    }

    let email = coachEmail;
    if (!email) {
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email ?? undefined;
    }
    if (!email) return json({ error: 'No coach email available' }, 400);

    const { data: room } = await supabase
      .from('coach_meeting_rooms')
      .select('room_url, room_label, provider')
      .ilike('coach_email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (room?.room_url) return json({ url: room.room_url, provider: room.provider, roomLabel: room.room_label });

    return json({
      error: `No meeting room registered for ${email} yet.`,
      needsRoomSetup: true,
      hint: 'The coach can add their Ooma Office room link on the Coach dashboard (My meeting room).',
    }, 404);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
