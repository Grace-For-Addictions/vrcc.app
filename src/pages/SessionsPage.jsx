// src/pages/SessionsPage.jsx
import { useState } from 'react';
import SessionRequestForm from '../components/sessions/SessionRequestForm';
import MySessionsList from '../components/sessions/MySessionsList';

export default function SessionsPage() {
  const [showForm, setShowForm] = useState(false);
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-spore-100">Sessions</h1>
          <p className="text-moss-300 mt-1">Peer support · recovery coaching · life coaching. Free, always.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="min-h-[52px] px-5 rounded-2xl bg-spore-500 text-moss-950 font-semibold shadow-glow">
          {showForm ? 'Close' : '+ Request a session'}
        </button>
      </header>
      {showForm && <SessionRequestForm onSubmitted={() => setShowForm(false)} />}
      <MySessionsList />
    </main>
  );
}
