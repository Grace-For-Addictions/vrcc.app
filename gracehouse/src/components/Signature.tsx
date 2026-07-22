import { useEffect, useRef, useState } from 'react';

export interface SignatureValue {
  mode: 'draw' | 'type';
  data: string; // drawn: dataURL · typed: the name
  signedAt: string;
}

/** Draw-or-type e-signature. Mirrors the DB signature model (representation + data). */
export default function Signature({ label, onChange }: { label: string; onChange: (v: SignatureValue | null) => void }) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = rect.width * dpr; c.height = rect.height * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1A1728';
  }, [mode]);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => { drawing.current = true; last.current = pos(e); };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current!.x, last.current!.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p; dirty.current = true;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current) onChange({ mode: 'draw', data: canvasRef.current!.toDataURL('image/png'), signedAt: new Date().toISOString() });
  };
  const clear = () => {
    const c = canvasRef.current;
    if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    dirty.current = false; setTyped(''); onChange(null);
  };

  return (
    <div className="border border-dashed border-line rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold">{label}</span>
        <div className="inline-flex rounded-lg border border-line overflow-hidden text-xs font-semibold">
          <button type="button" onClick={() => { setMode('draw'); clear(); }} className={`px-3 py-1 ${mode === 'draw' ? 'bg-plum text-white' : 'text-muted'}`}>Draw</button>
          <button type="button" onClick={() => { setMode('type'); clear(); }} className={`px-3 py-1 ${mode === 'type' ? 'bg-plum text-white' : 'text-muted'}`}>Type</button>
        </div>
      </div>
      {mode === 'draw' ? (
        <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
          className="w-full h-28 bg-paper border border-line rounded-lg touch-none cursor-crosshair" />
      ) : (
        <input value={typed} onChange={(e) => { setTyped(e.target.value); onChange(e.target.value.trim() ? { mode: 'type', data: e.target.value.trim(), signedAt: new Date().toISOString() } : null); }}
          placeholder="Type your full name" className="w-full bg-paper border border-line rounded-lg px-3 py-3 text-2xl" style={{ fontFamily: '"Snell Roundhand","Segoe Script",cursive' }} />
      )}
      <div className="flex justify-end mt-2"><button type="button" onClick={clear} className="text-xs font-semibold text-plum">Clear</button></div>
    </div>
  );
}
