import React, { useState } from 'react';
import { LifeBuoy, Phone, MessageSquare, X, Heart } from 'lucide-react';

// Always-available crisis support. Reachable from every screen, before and
// after sign-in. No auth, no data — just a fast path to a real person.
const RESOURCES = [
  { name: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988 — 24/7, free, confidential', href: 'tel:988', action: 'Call 988', sms: false },
  { name: 'Crisis Text Line', detail: 'Text HOME to 741741', href: 'sms:741741;?&body=HOME', action: 'Text', sms: true },
  { name: 'SAMHSA National Helpline', detail: 'Treatment referral & support · 1-800-662-4357', href: 'tel:18006624357', action: 'Call', sms: false },
  { name: 'Emergency', detail: 'If you are in immediate danger, call 911', href: 'tel:911', action: 'Call 911', sms: false },
];

export default function SupportNow() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
        aria-label="Get support now"
      >
        <LifeBuoy className="w-5 h-5" /> Support Now
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Crisis support resources"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-bold text-gray-900">You’re not alone</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Reach a real person right now. These are free, confidential, and open 24/7.
            </p>
            <div className="space-y-2">
              {RESOURCES.map((r) => (
                <a key={r.name} href={r.href} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-rose-50/60">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    {r.sms ? <MessageSquare className="w-4 h-4 text-rose-700" /> : <Phone className="w-4 h-4 text-rose-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.detail}</div>
                  </div>
                  <span className="text-xs font-semibold text-rose-700 shrink-0">{r.action}</span>
                </a>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">No fees. No stigma. Just grace. 💚</p>
          </div>
        </div>
      )}
    </>
  );
}
