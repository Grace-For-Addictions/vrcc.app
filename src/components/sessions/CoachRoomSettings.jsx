// components/sessions/CoachRoomSettings.jsx — a coach's one reusable room.
// One Ooma Office link hosts everything: 1:1 coaching, group coaching,
// recovery meetings, workshops, trainings, resource navigation, and
// needs-assessment visits.
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/useAuthStore';

export default function CoachRoomSettings() {
  const profile = useAuthStore((s) => s.profile);
  const [roomUrl, setRoomUrl] = useState('');
  const [label, setLabel] = useState('Coaching room');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile?.email) return;
    supabase.from('coach_meeting_rooms').select('room_url, room_label')
      .ilike('coach_email', profile.email).maybeSingle()
      .then(({ data }) => {
        if (data) { setRoomUrl(data.room_url); setLabel(data.room_label || 'Coaching room'); }
      });
  }, [profile?.email]);

  const save = async () => {
    setBusy(true); setSaved(false);
    await supabase.from('coach_meeting_rooms').upsert({
      coach_email: profile.email,
      coach_name: profile.display_name,
      provider: 'ooma',
      room_url: roomUrl.trim(),
      room_label: label.trim() || 'Coaching room',
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coach_email' });
    setBusy(false); setSaved(true);
  };

  const valid = /^https?:\/\/\S+/.test(roomUrl.trim());

  return (
    <section aria-labelledby="room-h" className="rounded-3xl border border-moss-700 bg-moss-900/40 p-6 space-y-4">
      <h2 id="room-h" className="font-display text-xl text-spore-100">My meeting room (Ooma Office)</h2>
      <p className="text-sm text-moss-300">
        Paste your Ooma Meetings room link once — it becomes the link participants receive for every
        session you accept, and you can reuse the same room for group coaching, recovery meetings,
        workshops, trainings, resource navigation, and needs-assessment visits.
      </p>
      <label className="block">
        <span className="text-moss-200 text-sm">Room link</span>
        <input value={roomUrl} onChange={(e) => { setRoomUrl(e.target.value); setSaved(false); }}
          placeholder="https://meetings.ooma.com/..." inputMode="url"
          className="mt-1 w-full min-h-[48px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-moss-100" />
      </label>
      <label className="block">
        <span className="text-moss-200 text-sm">Room name (shown to participants)</span>
        <input value={label} onChange={(e) => { setLabel(e.target.value); setSaved(false); }}
          className="mt-1 w-full min-h-[48px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-moss-100" />
      </label>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={!valid || busy}
          className="min-h-[48px] px-5 rounded-xl bg-spore-500 text-moss-950 font-semibold disabled:opacity-50">
          Save room
        </button>
        {saved && <span className="text-spore-200 text-sm" role="status">Saved — your sessions now use this room 🌱</span>}
        {!valid && roomUrl && <span className="text-amber-200 text-sm">Link should start with https://</span>}
      </div>
    </section>
  );
}
