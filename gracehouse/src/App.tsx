import { Routes, Route, NavLink } from 'react-router-dom';
import { CANON } from './lib/canonical';
import Home from './routes/Home';
import HouseInfo from './routes/HouseInfo';
import Placeholder from './routes/Placeholder';

function Shell({ children }: { children: React.ReactNode }) {
  const link = (to: string, label: string) => (
    <NavLink to={to} className={({ isActive }) =>
      `px-3 py-1.5 rounded-lg text-sm font-semibold ${isActive ? 'bg-plum text-white' : 'text-muted hover:text-plum'}`
    }>{label}</NavLink>
  );
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-paper/85 backdrop-blur border-b border-line">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-plum-dark text-white grid place-items-center" aria-hidden>♥</div>
          <div className="leading-tight">
            <div className="font-serif text-lg">Grace House</div>
            <div className="text-[11px] uppercase tracking-widest text-muted">Recovery Residence · VRCC</div>
          </div>
          <nav className="ml-auto flex items-center gap-1">
            {link('/', 'Welcome')}{link('/house', 'House info')}{link('/resident', 'Resident')}{link('/staff', 'Staff')}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-5 py-8">{children}</main>
      <footer className="max-w-5xl mx-auto px-5 py-8 text-xs text-muted border-t border-line mt-8">
        {CANON.operator} · {CANON.address} · {CANON.contact.office} · Warmline {CANON.contact.warmline}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/house" element={<HouseInfo />} />
        <Route path="/resident" element={<Placeholder title="Resident portal" note="Onboarding, daily check-in, recovery plan, fees, passes, documents, grievance — building next." />} />
        <Route path="/staff" element={<Placeholder title="Staff portal" note="Beds & waitlist, intake, drug screening, incidents, discharge workflow, curfew/pass queue — building next." />} />
        <Route path="*" element={<Placeholder title="Not found" note="That page doesn't exist yet." />} />
      </Routes>
    </Shell>
  );
}
