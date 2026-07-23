// components/housing/ResourceHub.jsx — the live Iowa resources table:
// county-aware (local + statewide), telehealth-first for rural access.
import React, { useEffect, useState } from 'react';
import { useHousingStore } from '../../stores/useHousingStore';
import { useAuthStore } from '../../stores/useAuthStore';

const CATEGORIES = ['', 'treatment', 'housing', 'crisis', 'peer_support', 'employment', 'legal', 'healthcare', 'transportation'];

export default function ResourceHub() {
  const profile = useAuthStore((s) => s.profile);
  const { resources, fetchResources } = useHousingStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [county, setCounty] = useState(profile?.county || '');
  const [telehealthOnly, setTelehealthOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => fetchResources({ search, category, county, telehealthOnly }), 250);
    return () => clearTimeout(t);
  }, [search, category, county, telehealthOnly]);

  return (
    <section aria-labelledby="hub-h" className="space-y-5">
      <h2 id="hub-h" className="font-display text-2xl text-spore-100">Resource Hub</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search resources"
          placeholder="Search anything — MAT, rides, food, legal…"
          className="min-h-[48px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-moss-100" />
        <input value={county} onChange={(e) => setCounty(e.target.value)} aria-label="Your county"
          placeholder="Your county (shows local + statewide)"
          className="min-h-[48px] rounded-xl bg-moss-950 border border-moss-700 px-4 text-moss-100" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {CATEGORIES.map((c) => (
          <button key={c || 'all'} onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`min-h-[44px] px-4 rounded-full border capitalize
              ${category === c ? 'border-spore-400 bg-spore-500/20 text-spore-100' : 'border-moss-700 text-moss-300'}`}>
            {c ? c.replace('_', ' ') : 'all'}
          </button>
        ))}
        <label className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-full border border-lichen-500/40 text-lichen-200 cursor-pointer">
          <input type="checkbox" checked={telehealthOnly} onChange={(e) => setTelehealthOnly(e.target.checked)} className="h-5 w-5" />
          Telehealth / virtual only
        </label>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2" aria-live="polite">
        {resources.map((r) => (
          <li key={r.resource_id} className="rounded-2xl border border-moss-700 bg-moss-900/40 p-5">
            <h3 className="font-display text-lg text-spore-100">{r.resource_name}</h3>
            <p className="mt-1 text-sm text-moss-300">
              {r.is_statewide ? 'Statewide' : [r.city, r.county && `${r.county} Co.`].filter(Boolean).join(' · ')}
              {r.is_virtual && ' · virtual'}
              {r.is_24_7 && ' · 24/7'}
            </p>
            {r.description && <p className="mt-2 text-moss-200 text-sm">{r.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {r.is_free && <span className="px-2 py-1 rounded-full bg-spore-500/15 text-spore-200">free</span>}
              {r.mat_friendly && <span className="px-2 py-1 rounded-full bg-lichen-500/15 text-lichen-200">MAT-friendly</span>}
              {r.justice_involved && <span className="px-2 py-1 rounded-full bg-amber-400/15 text-amber-200">justice-involved welcome</span>}
              {r.peer_led && <span className="px-2 py-1 rounded-full bg-spore-500/15 text-spore-200">peer-led</span>}
              {r.serves_rural && <span className="px-2 py-1 rounded-full bg-moss-700/60 text-moss-200">serves rural</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {r.phone_primary && (
                <a href={`tel:${r.phone_primary}`}
                  className="min-h-[48px] inline-flex items-center px-4 rounded-xl bg-spore-500 text-moss-950 font-semibold">
                  Call {r.phone_primary}
                </a>
              )}
              {r.website && (
                <a href={r.website} target="_blank" rel="noreferrer"
                  className="min-h-[48px] inline-flex items-center px-4 rounded-xl border border-moss-600 text-moss-100">
                  Website
                </a>
              )}
            </div>
          </li>
        ))}
        {resources.length === 0 && (
          <li className="text-moss-300 col-span-full">
            Nothing matched yet — try widening your search, or message your coach and we'll find it together.
          </li>
        )}
      </ul>
    </section>
  );
}
