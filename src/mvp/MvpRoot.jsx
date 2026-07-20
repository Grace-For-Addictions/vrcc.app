import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { resolveRole, isCoachRole, isAdminRole } from './lib';
import Landing from './Landing';
import SignIn from './SignIn';
import ParticipantApp from './ParticipantApp';
import CoachApp from './CoachApp';
import SupportNow from './SupportNow';
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

  let content;
  if (loading) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  } else if (!session) {
    content = view === 'signin'
      ? <SignIn onBack={() => setView('landing')} />
      : <Landing onGetStarted={() => setView('signin')} />;
  } else if (isCoachRole(role) || isAdminRole(role)) {
    content = <CoachApp user={session.user} onSignOut={signOut} />;
  } else {
    content = <ParticipantApp user={session.user} onSignOut={signOut} />;
  }

  // Support Now is always available — before and after sign-in.
  return (
    <>
      {content}
      <SupportNow />
    </>
  );
}
