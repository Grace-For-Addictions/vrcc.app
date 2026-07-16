import React, { useState } from 'react';
import { supabase } from './supabase';
import { PRONOUNS, HOUSING, TRANSPORT, REFERRAL_SOURCES } from './lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Loader2, ArrowRight } from 'lucide-react';

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <option value="">{placeholder || 'Select…'}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export default function Intake({ user, participant, onComplete }) {
  const [f, setF] = useState({
    first_name: participant?.first_name && participant.first_name !== '—' ? participant.first_name : '',
    last_name: participant?.last_name && participant.last_name !== '—' ? participant.last_name : '',
    preferred_name: participant?.preferred_name || '',
    pronouns: '',
    date_of_birth: '',
    phone: '',
    city: '',
    county: '',
    state: 'IA',
    housing_status: '',
    transportation_access: '',
    referral_source: '',
    drug_of_choice: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    intake_notes: '',
    dua_consent: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.first_name || !f.last_name) return setError('Please share your first and last name.');
    if (!f.dua_consent) return setError('Please review and agree to the data-use agreement to continue.');
    setBusy(true);
    setError('');
    try {
      const { error: iErr } = await supabase.from('participant_intakes').insert({
        participant_id: participant?.participant_id,
        first_name: f.first_name,
        last_name: f.last_name,
        preferred_name: f.preferred_name || null,
        pronouns: f.pronouns || null,
        date_of_birth: f.date_of_birth || null,
        phone: f.phone || null,
        email: user.email,
        city: f.city || null,
        county: f.county || null,
        state: f.state || null,
        housing_status: f.housing_status || null,
        transportation_access: f.transportation_access || null,
        referral_source: f.referral_source || null,
        drug_of_choice: f.drug_of_choice || null,
        emergency_contact_name: f.emergency_contact_name || null,
        emergency_contact_relationship: f.emergency_contact_relationship || null,
        emergency_contact_phone: f.emergency_contact_phone || null,
        intake_notes: f.intake_notes || null,
        dua_consent: f.dua_consent ? 'agreed' : null,
        intake_date: new Date().toISOString().slice(0, 10),
        created_by: user.email,
      });
      if (iErr) throw iErr;

      const { error: pErr } = await supabase
        .from('participants')
        .update({
          first_name: f.first_name,
          last_name: f.last_name,
          preferred_name: f.preferred_name || null,
          pronouns: f.pronouns || null,
          city: f.city || null,
          county: f.county || null,
          phone_primary: f.phone || null,
          intake_complete: true,
        })
        .eq('supabase_user_id', user.id);
      if (pErr) throw pErr;

      onComplete();
    } catch (err) {
      setError(err.message || 'Could not save your intake. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-teal-600 font-medium">Step 1 of 2 · Welcome</div>
            <h1 className="text-2xl font-bold text-gray-900">Let’s get to know you</h1>
          </div>
        </div>
        <p className="text-gray-600 mb-8">
          This helps your coach meet you where you are. Share what you’re comfortable with —
          you can update it anytime. There are no wrong answers.
        </p>

        <form onSubmit={submit} className="space-y-6 bg-white rounded-2xl border border-teal-100/60 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>First name *</Label><Input value={f.first_name} onChange={set('first_name')} /></div>
            <div><Label>Last name *</Label><Input value={f.last_name} onChange={set('last_name')} /></div>
            <div><Label>Preferred name</Label><Input value={f.preferred_name} onChange={set('preferred_name')} placeholder="What you like to be called" /></div>
            <Select label="Pronouns" value={f.pronouns} onChange={set('pronouns')} options={PRONOUNS} />
            <div><Label>Date of birth</Label><Input type="date" value={f.date_of_birth} onChange={set('date_of_birth')} /></div>
            <div><Label>Phone</Label><Input value={f.phone} onChange={set('phone')} placeholder="(000) 000-0000" /></div>
            <div><Label>City</Label><Input value={f.city} onChange={set('city')} /></div>
            <div><Label>County</Label><Input value={f.county} onChange={set('county')} /></div>
            <Select label="Housing situation" value={f.housing_status} onChange={set('housing_status')} options={HOUSING} />
            <Select label="Transportation" value={f.transportation_access} onChange={set('transportation_access')} options={TRANSPORT} />
            <Select label="How did you hear about us?" value={f.referral_source} onChange={set('referral_source')} options={REFERRAL_SOURCES} />
            <div><Label>What are you recovering from? (optional)</Label><Input value={f.drug_of_choice} onChange={set('drug_of_choice')} placeholder="Only if you want to share" /></div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Emergency contact (optional)</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>Name</Label><Input value={f.emergency_contact_name} onChange={set('emergency_contact_name')} /></div>
              <div><Label>Relationship</Label><Input value={f.emergency_contact_relationship} onChange={set('emergency_contact_relationship')} /></div>
              <div><Label>Phone</Label><Input value={f.emergency_contact_phone} onChange={set('emergency_contact_phone')} /></div>
            </div>
          </div>

          <div>
            <Label>Anything you’d like your coach to know?</Label>
            <Textarea value={f.intake_notes} onChange={set('intake_notes')} rows={3} placeholder="Optional — in your own words" />
          </div>

          <label className="flex items-start gap-3 rounded-lg bg-teal-50/60 p-4 cursor-pointer">
            <input type="checkbox" checked={f.dua_consent} onChange={(e) => set('dua_consent')(e.target.checked)} className="mt-1 h-4 w-4 accent-teal-600" />
            <span className="text-sm text-gray-700">
              I agree to Grace For Addictions’ data-use agreement. My information is kept private and
              used only to support my recovery. I can update or withdraw it at any time.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full bg-teal-600 hover:bg-teal-700 h-11 text-base">
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue to recovery check-in <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}
