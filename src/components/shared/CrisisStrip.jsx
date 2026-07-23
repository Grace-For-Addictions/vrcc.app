// components/shared/CrisisStrip.jsx — Connection Prevents Crisis.
// Always visible, always one tap away. Sourced from crisis_resources
// with a hardcoded lifeline fallback so it can never be empty.
import React, { useEffect } from 'react';
import { useHousingStore } from '../../stores/useHousingStore';

export default function CrisisStrip() {
  const { crisisResources, fetchCrisisResources } = useHousingStore();
  useEffect(() => { fetchCrisisResources(); }, []);

  return (
    <aside aria-label="Crisis support resources"
      className="rounded-2xl border border-amber-300/30 bg-amber-400/5 p-4">
      <p className="text-amber-200 font-medium text-sm mb-3">
        If tonight feels heavy, you are not alone — reach out any hour:
      </p>
      <ul className="flex flex-wrap gap-3">
        {crisisResources.slice(0, 4).map((c) => (
          <li key={c.crisis_resource_id}>
            {c.phone_number ? (
              <a href={`tel:${c.phone_number.replace(/[^\d+]/g, '')}`}
                className="min-h-[48px] inline-flex items-center px-4 rounded-xl border border-amber-300/40 text-amber-100 text-sm">
                {c.resource_name} · {c.phone_number}
              </a>
            ) : (
              <span className="min-h-[48px] inline-flex items-center px-4 rounded-xl border border-amber-300/40 text-amber-100 text-sm">
                {c.resource_name}{c.text_number ? ` · ${c.text_number}` : ''}
              </span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
