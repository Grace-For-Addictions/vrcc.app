// src/App.jsx — GFA VRCC shell: auth-gated, role-aware, crisis support always in reach.
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { watchConnectivity } from './lib/offlineQueue';
import { useCheckinStore } from './stores/useCheckinStore';

import NotificationBell from './components/shared/NotificationBell';
import OfflineBadge from './components/shared/OfflineBadge';
import CrisisStrip from './components/shared/CrisisStrip';

import SignInPage from './pages/SignInPage';
import DailyPracticePage from './pages/DailyPracticePage';
import SessionsPage from './pages/SessionsPage';
import CoachDashboardPage from './pages/CoachDashboardPage';
import HousingPage from './pages/HousingPage';
import ProgramDetailPage from './pages/ProgramDetailPage';
import ApplyPage from './pages/ApplyPage';
import AdminHousingPage from './pages/AdminHousingPage';

const navCls = ({ isActive }) =>
  `min-h-[48px] inline-flex items-center px-4 rounded-xl text-sm font-medium
   ${isActive ? 'bg-spore-500/20 text-spore-100' : 'text-moss-300 hover:text-moss-100'}`;

export default function App() {
  const { identity, profile, loading, init, signOut, isCoach, isAdmin } = useAuthStore();
  const syncOffline = useCheckinStore((s) => s.syncOffline);

  useEffect(() => {
    init();
    return watchConnectivity(() => syncOffline());
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-moss-950">
        <p className="text-moss-300 animate-pulse">Gathering the mycelium…</p>
      </main>
    );
  }

  if (!identity) return <SignInPage />;

  return (
    <BrowserRouter>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-spore-500 text-moss-950 px-4 py-3 rounded-xl">
        Skip to content
      </a>
      <div className="min-h-screen bg-moss-950 text-moss-100">
        <header className="sticky top-0 z-40 border-b border-moss-800 bg-moss-950/90 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-2 flex-wrap">
            <NavLink to="/" className="font-display text-xl text-spore-100 mr-2">GFA VRCC</NavLink>
            <nav aria-label="Primary" className="flex gap-1 flex-wrap">
              <NavLink to="/" end className={navCls}>Practice</NavLink>
              <NavLink to="/sessions" className={navCls}>Sessions</NavLink>
              <NavLink to="/housing" className={navCls}>Resources</NavLink>
              {isCoach() && <NavLink to="/coach" className={navCls}>Coach</NavLink>}
              {isAdmin() && <NavLink to="/admin/housing" className={navCls}>Ops</NavLink>}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <button onClick={signOut} className="min-h-[48px] px-3 rounded-xl text-moss-400 hover:text-moss-100 text-sm">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-5xl px-4 py-8">
          <Routes>
            <Route path="/" element={<DailyPracticePage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/housing" element={<HousingPage />} />
            <Route path="/housing/:id" element={<ProgramDetailPage />} />
            <Route path="/housing/:id/apply" element={<ApplyPage />} />
            <Route path="/coach" element={isCoach() ? <CoachDashboardPage /> : <Navigate to="/" replace />} />
            <Route path="/admin/housing" element={isAdmin() ? <AdminHousingPage /> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="mx-auto max-w-5xl px-4 pb-10 space-y-6">
          <CrisisStrip />
          <p className="text-center text-moss-500 text-sm">
            Grace For Addictions · Connection Prevents Crisis · No Fees. No Stigma. Just Grace. 🌱
          </p>
        </footer>

        <OfflineBadge />
      </div>
    </BrowserRouter>
  );
}
