// src/pages/CoachDashboardPage.jsx
import CoachRequestQueue from '../components/sessions/CoachRequestQueue';
import CoachRoomSettings from '../components/sessions/CoachRoomSettings';

export default function CoachDashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <header>
        <h1 className="font-display text-3xl text-spore-100">Coach Dashboard</h1>
        <p className="text-moss-300 mt-1">Take only what fits your life. The network holds the rest.</p>
      </header>
      <CoachRoomSettings />
      <CoachRequestQueue />
    </main>
  );
}
