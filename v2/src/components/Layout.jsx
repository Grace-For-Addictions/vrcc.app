import { NavLink } from 'react-router-dom'
import { Home, CalendarHeart, Sunrise, HousePlus, LogOut } from 'lucide-react'
import NotificationBell from './NotificationBell'
import OfflineBanner from './OfflineBanner'
import { supabase } from '../lib/supabase'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/sessions', label: 'Sessions', icon: CalendarHeart },
  { to: '/daily/morning', label: 'Daily', icon: Sunrise, match: '/daily' },
  { to: '/housing', label: 'Housing', icon: HousePlus },
]

export default function Layout({ profile, children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <OfflineBanner />
      <header className="sticky top-0 z-20 border-b border-grace-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <NavLink to="/" className="flex min-h-touch items-center gap-2 font-bold text-grace-800">
            <span className="text-xl">VRCC</span>
          </NavLink>
          <div className="flex items-center gap-1">
            <NotificationBell profile={profile} />
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="flex min-h-touch min-w-touch items-center justify-center rounded-xl text-grace-600 hover:bg-grace-100"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-grace-100 bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-3xl">
          {tabs.map(({ to, label, icon: Icon, end, match }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => {
                const active = isActive || (match && window.location.pathname.startsWith(match))
                return `flex min-h-touch flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium ${
                  active ? 'text-grace-700' : 'text-grace-400 hover:text-grace-600'
                }`
              }}
            >
              <Icon className="h-6 w-6" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
