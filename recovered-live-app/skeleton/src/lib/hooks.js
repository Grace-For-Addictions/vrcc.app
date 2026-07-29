import { useEffect, useState, useCallback } from 'react';
import { getMyProfile } from './api';
import { isConfigured } from './supabase';

/** Loads the signed-in user + participant_profiles crosswalk once. */
export function useParticipant() {
  const [state, setState] = useState({ loading: true, user: null, profile: null, error: null });
  const reload = useCallback(async () => {
    if (!isConfigured()) {
      setState({ loading: false, user: null, profile: null, error: 'offline' });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    try {
      const { user, profile } = await getMyProfile();
      setState({ loading: false, user, profile, error: null });
    } catch (e) {
      setState({ loading: false, user: null, profile: null, error: e.message || String(e) });
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}

/** Small async runner for one-shot queries. */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const run = useCallback(async () => {
    setState({ loading: true, data: null, error: null });
    try { setState({ loading: false, data: await fn(), error: null }); }
    catch (e) { setState({ loading: false, data: null, error: e.message || String(e) }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}
