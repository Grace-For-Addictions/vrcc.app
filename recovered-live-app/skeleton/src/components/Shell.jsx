import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Leaf } from 'lucide-react';
import { GROUPS, ROUTES } from '../routes';
import { isConfigured } from '../lib/supabase';

export default function Shell({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="shell">
      <aside className={open ? 'nav nav--open' : 'nav'}>
        <div className="brand">
          <Leaf size={20} /> <span>GFA VRCC</span>
        </div>
        {!isConfigured() && (
          <p className="warn">No <code>VITE_SUPABASE_ANON_KEY</code> set — data calls are offline.</p>
        )}
        <nav onClick={() => setOpen(false)}>
          {GROUPS.map((g) => (
            <div className="group" key={g}>
              <div className="group__label">{g}</div>
              {ROUTES.filter((r) => r.group === g).map((r) => (
                <NavLink key={r.path} to={`/${r.path}`}
                  className={({ isActive }) => (isActive ? 'link link--active' : 'link')}>
                  {r.title}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <button className="hamburger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <main className="content">{children}</main>
    </div>
  );
}
