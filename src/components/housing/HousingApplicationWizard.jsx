// src/components/housing/HousingApplicationWizard.jsx
// Step-by-step application for Grace House & other Iowa programs.
// Flow: Rules & Expectations (must review) → Personal Info → Recovery Journey
//       → "Your Why" → Consent → Review & Submit.
// Draft auto-saves at every step — a dropped rural connection never loses a story.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumMotion } from '../../lib/quantumMotion';
import { useHousingStore } from '../../stores/useHousingStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { VoiceTextField } from '../shared/VoiceTextField';

const STEPS = ['Rules', 'About You', 'Your Journey', 'Your Why', 'Consent', 'Review'];

const IOWA_COUNTIES = ['Polk','Linn','Scott','Johnson','Black Hawk','Woodbury','Dubuque','Story','Dallas','Pottawattamie','Other / Rural'];

export default function HousingApplicationWizard({ program, onSubmitted }) {
  const { collapse, ripple, reduced } = useQuantumMotion();
  const profile = useAuthStore((s) => s.profile);
  const { upsertDraft, submitApplication } = useHousingStore();

  const [step, setStep] = useState(0);
  const [appId, setAppId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [rulesReviewed, setRulesReviewed] = useState(false);
  const [personal, setPersonal] = useState({
    full_name: '', dob: '', phone: '', county: '',
    emergency_name: '', emergency_phone: '',
  });
  const [journey, setJourney] = useState('');
  const [pathway, setPathway] = useState('');
  const [justiceInvolved, setJusticeInvolved] = useState(null);
  const [why, setWhy] = useState('');
  const [consentShare, setConsentShare] = useState(false);
  const [contactMethod, setContactMethod] = useState('in_app');

  // Auto-save draft whenever the user advances a step
  const persistDraft = async (status = 'draft') => {
    setSaving(true);
    const { data } = await upsertDraft({
      ...(appId ? { id: appId } : {}),
      program_id: program.id,
      applicant_id: profile.id,
      status,
      personal,
      recovery_journey: journey || null,
      your_why: why || null,
      pathway: pathway || null,
      justice_involved: justiceInvolved,
      consent_rules_reviewed: rulesReviewed,
      consent_share_with_house: consentShare,
      consent_contact_method: contactMethod,
    });
    if (data?.id) setAppId(data.id);
    setSaving(false);
    return data;
  };

  const next = async () => { await persistDraft(); setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    const draft = await persistDraft();
    if (draft?.id ?? appId) {
      await submitApplication(draft?.id ?? appId);
      setDone(true);
      onSubmitted?.();
    }
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); }, [step]);

  if (done) {
    return (
      <motion.div {...collapse} role="status" aria-live="polite"
        className="rounded-3xl bg-moss-900/60 border border-spore-500/40 p-10 text-center">
        <div className="text-5xl mb-4" aria-hidden>💚</div>
        <h2 className="font-display text-3xl text-spore-100">Your story has been received</h2>
        <p className="mt-3 text-moss-200 max-w-md mx-auto">
          A Grace representative and the {program.name} house manager have been notified.
          They'll reach out to schedule your virtual intake — usually within a day or two.
          You've done the brave part.
        </p>
      </motion.div>
    );
  }

  const canAdvance = [
    rulesReviewed,                                          // 0 Rules
    personal.full_name && personal.county,                  // 1 About You
    true,                                                   // 2 Journey (optional depth)
    why.trim().length > 0,                                  // 3 Your Why (the heart)
    true,                                                   // 4 Consent (choices are the point)
    true,                                                   // 5 Review
  ][step];

  return (
    <motion.div {...ripple} className="space-y-8">
      {/* Progress — mycelium thread */}
      <nav aria-label="Application progress">
        <ol className="flex items-center gap-1">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1 flex items-center gap-1">
              <span aria-current={i === step ? 'step' : undefined}
                className={`h-10 w-10 shrink-0 grid place-items-center rounded-full border text-sm font-semibold
                  ${i < step ? 'bg-spore-500 border-spore-500 text-moss-950'
                   : i === step ? 'border-spore-400 text-spore-200'
                   : 'border-moss-700 text-moss-500'}`}>
                {i < step ? '✓' : i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span className={`h-0.5 flex-1 rounded ${i < step ? 'bg-spore-500' : 'bg-moss-800'}`} />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-moss-300 text-sm">{STEPS[step]} · step {step + 1} of {STEPS.length}
          {saving && <span className="ml-2 text-lichen-300">saving draft…</span>}
        </p>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div key={step} {...collapse}>
          {/* STEP 0 · Rules & Expectations — viewable BEFORE applying */}
          {step === 0 && (
            <section className="space-y-5" aria-labelledby="rules-h">
              <h2 id="rules-h" className="font-display text-2xl text-spore-100">
                {program.name} — Rules & What You Can Expect
              </h2>
              <p className="text-moss-300">Read these first, so there are no surprises. This is a covenant, not a contract.</p>
              <div className="space-y-3">
                {(program.rules ?? []).map((r) => (
                  <details key={r.title} className="rounded-2xl border border-moss-700 bg-moss-900/40 p-4 open:border-spore-500/40">
                    <summary className="min-h-[48px] flex items-center font-semibold text-spore-100 cursor-pointer">{r.title}</summary>
                    <p className="mt-2 text-moss-200">{r.body}</p>
                  </details>
                ))}
              </div>
              <h3 className="font-display text-xl text-spore-100 pt-2">What we owe you</h3>
              <ul className="space-y-2">
                {(program.expectations ?? []).map((e) => (
                  <li key={e.title} className="rounded-2xl border border-lichen-500/30 bg-lichen-500/5 p-4">
                    <p className="font-medium text-lichen-100">{e.title}</p>
                    <p className="text-moss-200 text-sm mt-1">{e.body}</p>
                  </li>
                ))}
              </ul>
              <label className="flex items-start gap-3 min-h-[48px] text-moss-100 pt-2">
                <input type="checkbox" checked={rulesReviewed} onChange={(e) => setRulesReviewed(e.target.checked)}
                  className="h-6 w-6 rounded accent-spore-500 mt-0.5" />
                I've read the rules and expectations, and they work for me.
              </label>
            </section>
          )}

          {/* STEP 1 · Personal info */}
          {step === 1 && (
            <section className="space-y-4" aria-labelledby="about-h">
              <h2 id="about-h" className="font-display text-2xl text-spore-100">About you</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['full_name', 'Full name', 'text'],
                  ['dob', 'Date of birth', 'date'],
                  ['phone', 'Phone (call or text)', 'tel'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label htmlFor={key} className="block text-moss-200 mb-1">{label}</label>
                    <input id={key} type={type} value={personal[key]}
                      onChange={(e) => setPersonal((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full min-h-[52px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-lg text-moss-50 focus:border-spore-400" />
                  </div>
                ))}
                <div>
                  <label htmlFor="county" className="block text-moss-200 mb-1">Iowa county</label>
                  <select id="county" value={personal.county}
                    onChange={(e) => setPersonal((p) => ({ ...p, county: e.target.value }))}
                    className="w-full min-h-[52px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-lg text-moss-50">
                    <option value="">Choose…</option>
                    {IOWA_COUNTIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="emergency_name" className="block text-moss-200 mb-1">Emergency contact name</label>
                  <input id="emergency_name" value={personal.emergency_name}
                    onChange={(e) => setPersonal((p) => ({ ...p, emergency_name: e.target.value }))}
                    className="w-full min-h-[52px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-lg text-moss-50" />
                </div>
                <div>
                  <label htmlFor="emergency_phone" className="block text-moss-200 mb-1">Emergency contact phone</label>
                  <input id="emergency_phone" type="tel" value={personal.emergency_phone}
                    onChange={(e) => setPersonal((p) => ({ ...p, emergency_phone: e.target.value }))}
                    className="w-full min-h-[52px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-lg text-moss-50" />
                </div>
              </div>
            </section>
          )}

          {/* STEP 2 · Recovery journey */}
          {step === 2 && (
            <section className="space-y-5" aria-labelledby="journey-h">
              <h2 id="journey-h" className="font-display text-2xl text-spore-100">Your recovery journey</h2>
              <p className="text-moss-300">In your own words, at your own depth. Every pathway is welcome here.</p>
              <VoiceTextField id="journey" rows={5} value={journey} onChange={setJourney}
                placeholder="Wherever you'd like to begin… (type or speak)" />
              <fieldset>
                <legend className="text-moss-200 mb-2">Which pathway feels most like yours right now?</legend>
                <div className="flex flex-wrap gap-2">
                  {[['abstinence','Abstinence'],['mat','MAT / medication-supported'],['harm_reduction','Harm reduction'],['exploring','Still exploring']].map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setPathway(v)} aria-pressed={pathway === v}
                      className={`min-h-[48px] px-4 rounded-full border
                        ${pathway === v ? 'border-spore-400 bg-spore-500/20 text-spore-50' : 'border-moss-700 text-moss-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-moss-200 mb-2">Are you navigating the justice system? (Helps us support you — never disqualifies you.)</legend>
                <div className="flex gap-3">
                  {[['Yes', true], ['No', false], ['Prefer not to say', null]].map(([label, v]) => (
                    <button key={label} type="button" onClick={() => setJusticeInvolved(v)}
                      aria-pressed={justiceInvolved === v}
                      className={`min-h-[48px] px-4 rounded-full border
                        ${justiceInvolved === v ? 'border-spore-400 bg-spore-500/20 text-spore-50' : 'border-moss-700 text-moss-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>
          )}

          {/* STEP 3 · Your Why */}
          {step === 3 && (
            <section className="space-y-4" aria-labelledby="why-h">
              <h2 id="why-h" className="font-display text-2xl text-spore-100">Your Why ✦</h2>
              <p className="text-moss-300">
                This is the heart of your application. Not what you're leaving — what you're moving <em>toward</em>.
                A declaration, in your voice.
              </p>
              <VoiceTextField id="why" rows={5} value={why} onChange={setWhy}
                placeholder="I want this because… I am becoming… (type or speak)" />
            </section>
          )}

          {/* STEP 4 · Consent */}
          {step === 4 && (
            <section className="space-y-4" aria-labelledby="consent-h">
              <h2 id="consent-h" className="font-display text-2xl text-spore-100">Your consent, your control</h2>
              <label className="flex items-start gap-3 min-h-[48px] text-moss-100 rounded-2xl border border-moss-700 p-4">
                <input type="checkbox" checked={consentShare} onChange={(e) => setConsentShare(e.target.checked)}
                  className="h-6 w-6 rounded accent-spore-500 mt-0.5" />
                <span>Share my application with the {program.name} house manager and Grace representatives so they can review it and schedule my intake. <span className="text-moss-400 text-sm block mt-1">Required to submit — this is exactly who reads it, and no one else.</span></span>
              </label>
              <fieldset>
                <legend className="text-moss-200 mb-2">How should we reach you about next steps?</legend>
                <div className="flex flex-wrap gap-2">
                  {[['in_app','In-app only'],['email','Email too'],['sms','Text me']].map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setContactMethod(v)} aria-pressed={contactMethod === v}
                      className={`min-h-[48px] px-4 rounded-full border
                        ${contactMethod === v ? 'border-spore-400 bg-spore-500/20 text-spore-50' : 'border-moss-700 text-moss-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>
          )}

          {/* STEP 5 · Review */}
          {step === 5 && (
            <section className="space-y-4" aria-labelledby="review-h">
              <h2 id="review-h" className="font-display text-2xl text-spore-100">One last look</h2>
              <dl className="rounded-3xl border border-moss-700 bg-moss-900/40 p-6 space-y-3 text-moss-100">
                <div><dt className="text-moss-400 text-sm">Applying to</dt><dd className="text-lg">{program.name} · {program.city}, Iowa</dd></div>
                <div><dt className="text-moss-400 text-sm">Name</dt><dd>{personal.full_name || '—'}</dd></div>
                <div><dt className="text-moss-400 text-sm">County</dt><dd>{personal.county || '—'}</dd></div>
                <div><dt className="text-moss-400 text-sm">Your Why</dt><dd className="italic">“{why || '—'}”</dd></div>
              </dl>
              {!consentShare && (
                <p className="text-amber-200" role="alert">
                  To submit, please go back and consent to sharing with the house team — they can't read it otherwise.
                </p>
              )}
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={back}
            className="min-h-[56px] px-6 rounded-2xl border border-moss-600 text-moss-100 focus-visible:ring-4 ring-spore-400/60">
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={next} disabled={!canAdvance}
            className="flex-1 min-h-[56px] rounded-2xl bg-spore-500 text-moss-950 font-semibold text-lg shadow-glow disabled:opacity-40 focus-visible:ring-4 ring-spore-300">
            Continue
          </button>
        ) : (
          <button onClick={submit} disabled={!consentShare || saving}
            className="flex-1 min-h-[56px] rounded-2xl bg-spore-500 text-moss-950 font-semibold text-lg shadow-glow disabled:opacity-40 focus-visible:ring-4 ring-spore-300">
            {saving ? 'Sending…' : 'Submit my application'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
