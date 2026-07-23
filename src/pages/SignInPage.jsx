// pages/SignInPage.jsx — gentle gate into the community.
import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

export default function SignInPage() {
  const { signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true); setMsg(null);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    if (error) setMsg(error.message);
    else if (mode === 'signup') setMsg('Check your email to confirm your account, then sign in.');
    setBusy(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-moss-950">
      <div className="w-full max-w-md rounded-3xl border border-moss-700 bg-moss-900/50 p-8 shadow-glow">
        <h1 className="font-display text-3xl text-spore-100">GFA VRCC</h1>
        <p className="mt-1 text-moss-300">Connection Prevents Crisis. No fees. No stigma. Just grace.</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-moss-200 text-sm">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              className="mt-1 w-full min-h-[48px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-moss-100" />
          </label>
          <label className="block">
            <span className="text-moss-200 text-sm">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="mt-1 w-full min-h-[48px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-moss-100" />
          </label>
          {msg && <p role="alert" className="text-amber-200 text-sm">{msg}</p>}
          <button onClick={go} disabled={busy || !email || !password}
            className="w-full min-h-[52px] rounded-xl bg-spore-500 text-moss-950 font-semibold disabled:opacity-50">
            {mode === 'signin' ? 'Enter the community' : 'Create your account'}
          </button>
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(null); }}
            className="w-full min-h-[48px] text-moss-300 hover:text-moss-100 text-sm">
            {mode === 'signin' ? 'New here? Create an account' : 'Already with us? Sign in'}
          </button>
        </div>
      </div>
    </main>
  );
}
