import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { resolveRole, isCoachRole, isAdminRole } from './lib';
import Landing from './Landing';
import SignIn from './SignIn';
import ParticipantApp from './ParticipantApp';
import CoachApp from './CoachApp';
import { Loader2 } from 'lucide-react';

export default function MvpRoot() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing'); // 'landing' | 'signin' (pre-auth)

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) handleSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      handleSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSession(s) {
    setSession(s);
    if (s?.user) {
      const r = await resolveRole(s.user);
      setRole(r);
    } else {
      setRole(null);
    }
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (view === 'signin') return <SignIn onBack={() => setView('landing')} />;
    return <Landing onGetStarted={() => setView('signin')} />;
  }

  if (isCoachRole(role) || isAdminRole(role)) {
    return <CoachApp user={session.user} onSignOut={signOut} />;
  }
  return <ParticipantApp user={session.user} onSignOut={signOut} />;
}
