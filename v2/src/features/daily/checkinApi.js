import { supabase } from '../../lib/supabase'
import { resilientWrite, newClientRef } from '../../lib/syncQueue'

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export async function loadToday(participantId) {
  const { data } = await supabase
    .from('v2_daily_checkins')
    .select('*')
    .eq('participant_id', participantId)
    .eq('checkin_date', todayISO())
    .maybeSingle()
  return data
}

/** Upsert today's check-in row (morning and evening share one row per day). */
export async function saveCheckin(participantId, fields) {
  return resilientWrite(supabase, {
    table: 'v2_daily_checkins',
    op: 'upsert',
    onConflict: 'participant_id,checkin_date',
    payload: {
      participant_id: participantId,
      checkin_date: todayISO(),
      client_ref: newClientRef(),
      ...fields,
    },
  })
}

/** Upload a voice note; returns the storage path (or null offline). */
export async function uploadVoiceNote(participantId, blob, slot) {
  if (!blob || !navigator.onLine) return null
  const path = `${participantId}/${todayISO()}-${slot}.webm`
  const { error } = await supabase.storage
    .from('voice-notes')
    .upload(path, blob, { upsert: true, contentType: blob.type })
  return error ? null : path
}
