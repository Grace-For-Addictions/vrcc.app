import { motion } from 'framer-motion';

/** Shared frame for the fleshed-out screens (Lobby, ICARE Plan, Check-In). */
export default function ScreenFrame({ title, group, subtitle, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="screen">
      {group && <span className="chip">{group}</span>}
      <h1>{title}</h1>
      {subtitle && <p className="muted lead">{subtitle}</p>}
      {children}
    </motion.div>
  );
}

export function Offline() {
  return <div className="card"><p className="muted">Offline — set <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> to load live data.</p></div>;
}
export function Loading() { return <div className="card"><p className="muted">Loading…</p></div>; }
export function ErrorBox({ msg }) { return <div className="card errorbox"><b>Couldn't load</b><p className="muted">{msg}</p></div>; }
export function Empty({ children }) { return <div className="card"><p className="muted">{children}</p></div>; }
