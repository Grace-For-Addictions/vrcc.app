// src/components/shared/VoiceTextField.jsx
// Voice-first textarea: type OR speak. Web Speech API with graceful fallback.
// Large touch targets, visible focus, works fully offline (text mode).

import { useRef, useState, useEffect } from 'react';
import { createSpeechRecognizer } from '../../lib/voice';

export function VoiceTextField({ id, label, value, onChange, placeholder, rows = 3 }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);
  const baseRef = useRef('');

  useEffect(() => () => recRef.current?.stop?.(), []);

  const toggle = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    baseRef.current = value ? value + ' ' : '';
    const rec = createSpeechRecognizer({
      onResult: (t) => onChange(baseRef.current + t),
      onEnd: () => setListening(false),
    });
    if (!rec) { setSupported(false); return; }
    recRef.current = rec; rec.start(); setListening(true);
  };

  return (
    <div>
      {label && <label htmlFor={id} className="block text-moss-200 mb-2">{label}</label>}
      <div className="relative">
        <textarea
          id={id} rows={rows} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl bg-moss-950/80 border border-moss-700 p-4 pr-16 text-lg text-moss-50
                     placeholder:text-moss-500 focus:border-spore-400 focus-visible:ring-4 ring-spore-400/40"
        />
        {supported && (
          <button type="button" onClick={toggle}
            aria-pressed={listening}
            aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            className={`absolute right-3 top-3 h-12 w-12 rounded-full grid place-items-center text-xl
              focus-visible:ring-4 ring-spore-400/60 transition-colors
              ${listening ? 'bg-amber-400/25 text-amber-200 animate-pulse motion-reduce:animate-none' : 'bg-moss-800 text-moss-200 hover:bg-moss-700'}`}>
            🎙
          </button>
        )}
      </div>
      {listening && <p className="text-sm text-amber-200 mt-1" role="status">Listening… speak freely.</p>}
    </div>
  );
}
