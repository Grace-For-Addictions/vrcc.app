// src/stores/useAuthStore.js
import { create } from 'zustand';
import { supabase, getMyIdentity } from '../lib/supabaseClient';

const toProfile = (identity) => identity ? {
  id: identity.participant?.participant_id ?? identity.userId,
  email: identity.email,
  display_name: identity.displayName,
  role: identity.role,
  county: identity.participant?.county ?? null,
  coach_types: [],
  assigned_coach_email: identity.participant?.assigned_coach_email ?? null,
  assigned_coach_name: identity.participant?.assigned_coach_name ?? null,
} : null;

export const useAuthStore = create((set, get) => ({
  identity: null,
  profile: null,
  loading: true,

  init: async () => {
    const identity = await getMyIdentity();
    set({ identity, profile: toProfile(identity), loading: false });
    supabase.auth.onAuthStateChange(async (_evt, session) => {
      const next = session ? await getMyIdentity() : null;
      set({ identity: next, profile: toProfile(next), loading: false });
    });
  },

  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signUp: (email, password) => supabase.auth.signUp({ email, password }),
  signOut: async () => { await supabase.auth.signOut(); set({ identity: null, profile: null }); },

  isCoach: () => ['coach', 'admin'].includes(get().identity?.role),
  isAdmin: () => get().identity?.role === 'admin',
  participantId: () => get().identity?.participant?.participant_id ?? null,
}));
