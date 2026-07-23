// src/stores/useHousingStore.js — directory_entries + residence_beds + housing_applications
// + the production Iowa `resources` table (county / rural / telehealth filters).
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

export const useHousingStore = create((set, get) => ({
  programs: [],
  resources: [],
  crisisResources: [],
  beds: [],
  myApplications: [],
  adminApplications: [],
  draft: null,

  fetchPrograms: async () => {
    const { data } = await supabase.from('v_housing_availability').select('*').order('name');
    set({ programs: data ?? [] });
  },

  fetchProgram: async (id) => {
    const { data } = await supabase.from('directory_entries').select('*').eq('id', id).single();
    return data;
  },

  fetchResources: async ({ search = '', category = '', county = '', telehealthOnly = false } = {}) => {
    let q = supabase.from('resources').select(
      'resource_id, resource_name, resource_category, description, city, county, is_statewide, is_virtual, serves_rural, phone_primary, website, is_free, mat_friendly, justice_involved, peer_led, is_24_7'
    ).eq('is_active', true).eq('is_deleted', false).order('resource_name');
    if (search) q = q.or(`resource_name.ilike.%${search}%,description.ilike.%${search}%`);
    if (category) q = q.eq('resource_category', category);
    if (county) q = q.or(`county.eq.${county},is_statewide.eq.true`);
    if (telehealthOnly) q = q.eq('is_virtual', true);
    const { data } = await q;
    set({ resources: data ?? [] });
  },

  fetchCrisisResources: async () => {
    const { data } = await supabase.from('crisis_resources').select('*')
      .eq('is_active', true).order('display_order');
    // Always keep a lifeline visible even if the table read fails
    set({
      crisisResources: (data && data.length) ? data : [
        { crisis_resource_id: 'f1', resource_name: '988 Suicide & Crisis Lifeline', phone_number: '988', text_number: '988', availability: '24/7' },
        { crisis_resource_id: 'f2', resource_name: 'Crisis Text Line', text_number: 'Text HOME to 741741', availability: '24/7' },
        { crisis_resource_id: 'f3', resource_name: 'YourLifeIowa', phone_number: '855-581-8111', text_number: 'Text 855-895-8398', availability: '24/7' },
        { crisis_resource_id: 'f4', resource_name: 'SAMHSA National Helpline', phone_number: '1-800-662-4357', availability: '24/7' },
      ],
    });
  },

  // ---- Application wizard (draft persists every step) ----
  upsertDraft: async (legacy) => {
    const { identity } = useAuthStore.getState();
    const f = legacy || {};
    const base = {
      entry_id: f.program_id ?? f.entry_id ?? null,
      entry_name: f.entry_name ?? f.program_name ?? null,
      participant_id: identity.participant?.participant_id ?? null,
      applicant_email: identity.email,
      applicant_name: f.personal?.full_name ?? null,
      applicant_phone: f.personal?.phone ?? null,
      county: f.personal?.county ?? null,
      personal: f.personal ?? {},
      journey: { recovery_journey: f.recovery_journey ?? null, pathway: f.personal?.pathway ?? null },
      your_why: f.your_why ?? null,
      consent_rules_reviewed: !!f.consent_rules_reviewed,
      consent_share_with_house: !!f.consent_share_with_house,
      consent_contact: f.consent_contact_method !== 'none',
      status: 'draft',
      updated_at: new Date().toISOString(),
    };
    const existing = get().draft;
    if (existing?.id) {
      const { data } = await supabase.from('housing_applications')
        .update(base).eq('id', existing.id).select().single();
      set({ draft: data });
      return { data };
    }
    const { data } = await supabase.from('housing_applications').insert(base).select().single();
    set({ draft: data });
    return { data };
  },

  submitApplication: async (legacyId) => {
    const d = get().draft;
    const id = legacyId ?? d?.id;
    if (!id) throw new Error('No draft to submit');
    const { data, error } = await supabase.from('housing_applications')
      .update({ status: 'submitted' }).eq('id', id).select().single();
    if (error) throw error;
    set({ draft: null });
    return data;
  },

  fetchMyApplications: async () => {
    const { identity } = useAuthStore.getState();
    const { data } = await supabase.from('housing_applications').select('*')
      .eq('applicant_email', identity.email).order('created_date', { ascending: false });
    set({ myApplications: data ?? [] });
    const draft = (data ?? []).find((a) => a.status === 'draft');
    if (draft) set({ draft });
  },

  // ---- Navigator/Admin ----
  fetchAdminApplications: async () => {
    const { data } = await supabase.from('housing_applications').select('*')
      .neq('status', 'draft').order('submitted_at', { ascending: false });
    set({ adminApplications: data ?? [] });
  },

  scheduleIntake: async (appId, whenIso, provider, url) => {
    await supabase.from('housing_applications')
      .update({ intake_at: whenIso, intake_provider: provider, intake_url: url, status: 'intake_scheduled' })
      .eq('id', appId);
    await get().fetchAdminApplications();
  },

  setApplicationStatus: async (appId, status, note) => {
    await supabase.from('housing_applications')
      .update({ status, decision_note: note ?? null, decided_at: new Date().toISOString() })
      .eq('id', appId);
    await get().fetchAdminApplications();
  },

  fetchBeds: async (residenceId) => {
    const { data } = await supabase.from('residence_beds').select('*')
      .eq('residence_id', residenceId).order('label');
    set({ beds: data ?? [] });
  },

  addBed: async (residenceId, label) => {
    await supabase.from('residence_beds').insert({ residence_id: residenceId, label });
    await get().fetchBeds(residenceId);
  },

  setBedStatus: async (bedId, status, residenceId) => {
    await supabase.from('residence_beds')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', bedId);
    await get().fetchBeds(residenceId);
  },

  subscribeBeds: (residenceId) => {
    const ch = supabase.channel('vrcc-beds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'residence_beds' },
        () => get().fetchBeds(residenceId))
      .subscribe();
    return () => supabase.removeChannel(ch);
  },
}));
