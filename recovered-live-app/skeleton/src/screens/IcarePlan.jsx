import { useState } from 'react';
import { ui } from '../lib/api';
import { useParticipant, useAsync } from '../lib/hooks';
import { isConfigured } from '../lib/supabase';
import ScreenFrame, { Offline, Loading, ErrorBox, Empty } from '../components/ScreenFrame';

// ICARE Plan → gfa_ui.icare_plans (uuid participant_id). Shows the participant's
// current phase, phase goals, selected goals (text[]), and action_items (jsonb
// [{text, done}]). action_items and phase_goals are lightly editable and saved back.
// (gfa_icare.icare_steps is a coach-authored, integer-keyed detail table — different
// identity space — so it's referenced but not written here.)
export default function IcarePlan() {
  if (!isConfigured()) return <ScreenFrame title="ICARE Plan" group="ICARE Path"><Offline /></ScreenFrame>;
  return <IcarePlanLive />;
}

function IcarePlanLive() {
  const me = useParticipant();
  const plan = useAsync(async () => {
    if (!me.profile) return null;
    const { data, error } = await ui('icare_plans')
      .select('id, icare_phase, phase_start_date, phase_goals, selected_goals, action_items, status, coach_name, updated_at')
      .eq('participant_id', me.profile.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }, [me.profile?.id]);

  if (me.loading || plan.loading) return <ScreenFrame title="ICARE Plan" group="ICARE Path"><Loading /></ScreenFrame>;
  if (me.error && me.error !== 'offline') return <ScreenFrame title="ICARE Plan" group="ICARE Path"><ErrorBox msg={me.error} /></ScreenFrame>;
  if (plan.error) return <ScreenFrame title="ICARE Plan" group="ICARE Path"><ErrorBox msg={plan.error} /></ScreenFrame>;
  if (!me.profile) return <ScreenFrame title="ICARE Plan" group="ICARE Path"><Empty>Sign in to view your plan.</Empty></ScreenFrame>;
  if (!plan.data) return <ScreenFrame title="ICARE Plan" group="ICARE Path"><Empty>No plan yet — your coach will start one with you.</Empty></ScreenFrame>;

  return <PlanView plan={plan.data} onSaved={plan.reload} />;
}

function PlanView({ plan, onSaved }) {
  const [goals, setGoals] = useState(plan.phase_goals || '');
  const [items, setItems] = useState(normalizeItems(plan.action_items));
  const [newItem, setNewItem] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const dirty = goals !== (plan.phase_goals || '') || JSON.stringify(items) !== JSON.stringify(normalizeItems(plan.action_items));

  const save = async () => {
    setBusy(true); setErr(null);
    const { error } = await ui('icare_plans')
      .update({ phase_goals: goals, action_items: items })
      .eq('id', plan.id);
    setBusy(false);
    if (error) setErr(error.message); else onSaved();
  };

  return (
    <ScreenFrame title="Your ICARE Plan" group="ICARE Path"
      subtitle="Identify · Cultivate · Act · Reflect · Evolve — your recovery, in your words.">
      <div className="card">
        <div className="row-between">
          <span className="phase-badge">{plan.icare_phase || 'Phase 1'}</span>
          {plan.status && <span className="muted small">{plan.status}</span>}
        </div>
        {plan.phase_start_date && <p className="muted small">Started {plan.phase_start_date}{plan.coach_name ? ` · with ${plan.coach_name}` : ''}</p>}
        {Array.isArray(plan.selected_goals) && plan.selected_goals.length > 0 && (
          <div className="chips">{plan.selected_goals.map((g, i) => <span key={i} className="pill">{g}</span>)}</div>
        )}
      </div>

      <div className="card">
        <h2>Phase goals</h2>
        <textarea rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="What are you working toward this phase?" />
      </div>

      <div className="card">
        <h2>Action items</h2>
        {items.length === 0 && <p className="muted small">Nothing yet — add a small next step.</p>}
        <ul className="checklist">
          {items.map((it, i) => (
            <li key={i}>
              <label>
                <input type="checkbox" checked={!!it.done} onChange={() => setItems(items.map((x, j) => j === i ? { ...x, done: !x.done } : x))} />
                <span className={it.done ? 'done' : ''}>{it.text}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="add-row">
          <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add an action item…"
            onKeyDown={(e) => { if (e.key === 'Enter' && newItem.trim()) { setItems([...items, { text: newItem.trim(), done: false }]); setNewItem(''); } }} />
          <button className="btn btn--ghost" onClick={() => { if (newItem.trim()) { setItems([...items, { text: newItem.trim(), done: false }]); setNewItem(''); } }}>Add</button>
        </div>
      </div>

      {err && <ErrorBox msg={err} />}
      <button className="btn" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : dirty ? 'Save plan' : 'Saved'}</button>
    </ScreenFrame>
  );
}

// action_items may be jsonb array of strings or {text,done}; normalize to {text,done}.
function normalizeItems(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => typeof x === 'string' ? { text: x, done: false } : { text: x.text ?? '', done: !!x.done });
}
