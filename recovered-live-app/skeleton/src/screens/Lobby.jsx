import { useState } from 'react';
import { motion } from 'framer-motion';
import { ui, getAuthUser } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { isConfigured } from '../lib/supabase';
import ScreenFrame, { Offline, Loading, ErrorBox } from '../components/ScreenFrame';

const ROLES = [
  { value: 'participant', label: 'Participant — I want recovery support' },
  { value: 'peer', label: 'Peer supporter' },
  { value: 'coach', label: 'Peer recovery coach' },
];

// Lobby → gfa_ui.access_requests. A newcomer submits a request; returning users
// see its status. Columns: user_id, email, full_name, role_requested, reason,
// status, denial_reason, created_at.
export default function Lobby() {
  if (!isConfigured()) return <ScreenFrame title="Lobby" group="Onboarding"><Offline /></ScreenFrame>;
  return <LobbyLive />;
}

function LobbyLive() {
  const existing = useAsync(async () => {
    const user = await getAuthUser();
    if (!user) return { user: null, request: null };
    const { data, error } = await ui('access_requests')
      .select('id, full_name, email, role_requested, reason, status, denial_reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { user, request: data };
  }, []);

  if (existing.loading) return <ScreenFrame title="Lobby" group="Onboarding"><Loading /></ScreenFrame>;
  if (existing.error) return <ScreenFrame title="Lobby" group="Onboarding"><ErrorBox msg={existing.error} /></ScreenFrame>;

  const { user, request } = existing.data;
  return (
    <ScreenFrame title="Welcome to the Lobby" group="Onboarding"
      subtitle="No fees. No stigma. Just Grace. Tell us a little about you and we'll open the door.">
      {!user && <NeedsSignIn />}
      {user && request && <RequestStatus request={request} />}
      {user && !request && <RequestForm user={user} onDone={existing.reload} />}
    </ScreenFrame>
  );
}

function RequestStatus({ request }) {
  const tone = { pending: 'warn', approved: 'ok', denied: 'bad' }[request.status] || 'warn';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
      <div className={`status status--${tone}`}>{(request.status || 'pending').toUpperCase()}</div>
      <p>Thanks, <b>{request.full_name || 'friend'}</b>. Your request to join as
        {' '}<b>{request.role_requested || 'participant'}</b> is recorded.</p>
      {request.status === 'pending' && <p className="muted">A coordinator will review it soon. You'll get access as soon as it's approved.</p>}
      {request.status === 'approved' && <p className="muted">You're in. Head to your ICARE Plan to get started. 🌿</p>}
      {request.status === 'denied' && request.denial_reason && <p className="muted">Note: {request.denial_reason}</p>}
    </motion.div>
  );
}

function RequestForm({ user, onDone }) {
  const [f, setF] = useState({ full_name: '', email: user.email || '', role_requested: 'participant', reason: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await ui('access_requests').insert({
      user_id: user.id, email: f.email, full_name: f.full_name,
      role_requested: f.role_requested, reason: f.reason, status: 'pending',
    });
    setBusy(false);
    if (error) setErr(error.message); else onDone();
  };

  return (
    <form className="card" onSubmit={submit}>
      {err && <ErrorBox msg={err} />}
      <label className="field"><span>Your name</span>
        <input value={f.full_name} onChange={(e) => set('full_name', e.target.value)} required /></label>
      <label className="field"><span>Email</span>
        <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} required /></label>
      <label className="field"><span>I'm joining as</span>
        <select value={f.role_requested} onChange={(e) => set('role_requested', e.target.value)}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select></label>
      <label className="field"><span>What brings you here? (optional)</span>
        <textarea rows={3} value={f.reason} onChange={(e) => set('reason', e.target.value)} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Request access'}</button>
    </form>
  );
}

function NeedsSignIn() {
  return <div className="card"><p className="muted">Sign in to request access. (Auth flow is out of scope for this skeleton — the
    production app gates the Lobby behind Supabase Auth.)</p></div>;
}
