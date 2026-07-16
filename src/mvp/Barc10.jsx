import React, { useState } from 'react';
import { supabase } from './supabase';
import { BARC10_ITEMS, BARC10_SCALE, soilForScore, barcInsight, displayName } from './lib';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Barc10({ user, participant, onComplete }) {
  const [answers, setAnswers] = useState(Array(BARC10_ITEMS.length).fill(0));
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const answered = answers.filter((a) => a > 0).length;
  const pick = (val) => {
    const next = [...answers];
    next[idx] = val;
    setAnswers(next);
    if (idx < BARC10_ITEMS.length - 1) setTimeout(() => setIdx(idx + 1), 150);
  };

  const submit = async () => {
    if (answers.some((a) => a === 0)) {
      setError('Please answer every item — there are no wrong answers.');
      const firstMissing = answers.findIndex((a) => a === 0);
      setIdx(firstMissing);
      return;
    }
    setBusy(true);
    setError('');
    const total = answers.reduce((s, a) => s + a, 0);
    const soil = soilForScore(total);
    const insight = barcInsight(total);
    try {
      const answersObj = {};
      BARC10_ITEMS.forEach((q, i) => { answersObj[`q${i + 1}`] = answers[i]; });
      const { error: aErr } = await supabase.from('barc10_assessments').insert({
        participant_id: participant?.participant_id,
        participant_name: `${participant?.first_name || ''} ${participant?.last_name || ''}`.trim(),
        answers: answersObj,
        total,
        soil_type: soil.code,
        insight,
        date: new Date().toISOString().slice(0, 10),
        created_by: user.email,
      });
      if (aErr) throw aErr;
      const { error: pErr } = await supabase
        .from('participants')
        .update({ barc10_complete: true, barc10_score: total })
        .eq('supabase_user_id', user.id);
      if (pErr) throw pErr;
      setResult({ total, soil, insight });
    } catch (err) {
      setError(err.message || 'Could not save your check-in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-amber-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white rounded-2xl border border-teal-100/60 shadow-xl p-8 text-center">
          <div className="text-6xl mb-3">{result.soil.emoji}</div>
          <h2 className="text-2xl font-bold text-gray-900">{result.soil.label}</h2>
          <p className="text-gray-500">{result.soil.description}</p>
          <div className="my-5 inline-flex items-baseline gap-1 rounded-full bg-teal-50 px-4 py-2">
            <span className="text-3xl font-extrabold text-teal-700">{result.total}</span>
            <span className="text-sm text-teal-600">/ 60 recovery capital</span>
          </div>
          <p className="text-gray-700 mb-6">{result.insight}</p>
          <Button onClick={onComplete} className="w-full bg-teal-600 hover:bg-teal-700 h-11 text-base">
            Enter the community <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const q = BARC10_ITEMS[idx];
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-teal-600 font-medium">Step 2 of 2 · Recovery check-in</div>
            <h1 className="text-xl font-bold text-gray-900">Hi {displayName(participant)} — how are things, really?</h1>
          </div>
        </div>

        {/* progress */}
        <div className="h-2 rounded-full bg-teal-100 mb-2 overflow-hidden">
          <div className="h-full bg-teal-500 transition-all" style={{ width: `${(answered / BARC10_ITEMS.length) * 100}%` }} />
        </div>
        <div className="text-xs text-gray-400 mb-6">{answered} of {BARC10_ITEMS.length} answered</div>

        <div className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-6 sm:p-8">
          <div className="text-sm text-gray-400 mb-2">Item {idx + 1} of {BARC10_ITEMS.length}</div>
          <p className="text-lg font-medium text-gray-900 mb-6">{q}</p>
          <div className="space-y-2">
            {BARC10_SCALE.map((s) => (
              <button
                key={s.value}
                onClick={() => pick(s.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  answers[idx] === s.value
                    ? 'border-teal-500 bg-teal-50 text-teal-900 font-medium'
                    : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/40 text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="text-gray-500">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {idx < BARC10_ITEMS.length - 1 ? (
              <Button variant="ghost" onClick={() => setIdx(idx + 1)} className="text-teal-700">
                Skip for now <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={busy} className="bg-teal-600 hover:bg-teal-700">
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                See my results
              </Button>
            )}
          </div>
          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
}
