import { CANON, curfewFor, fmtTime, type Phase } from '../lib/canonical';
export default function HouseInfo() {
  const phases: Phase[] = [1, 2, 3];
  const money = (n: number) => `$${n}`;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">House information</h1>
        <p className="text-muted mt-1 text-sm">These values render live from the canonical policy — the same source the documents use.</p>
      </div>
      <section>
        <h2 className="font-serif text-xl mb-3">Curfew &amp; quiet hours</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-line rounded-xl overflow-hidden">
            <thead className="bg-plum-light text-left">
              <tr><th className="p-3">Phase</th><th className="p-3">Sun–Thu</th><th className="p-3">Fri–Sat</th></tr>
            </thead>
            <tbody>
              {phases.map((p) => (
                <tr key={p} className="border-t border-line">
                  <td className="p-3 font-medium">Phase {p} {p === 1 ? '(days 1–30)' : p === 2 ? '(days 31–90)' : '(days 91+)'}</td>
                  <td className="p-3 tabular-nums">{fmtTime(curfewFor(p, 'sunThu'))}</td>
                  <td className="p-3 tabular-nums">{fmtTime(curfewFor(p, 'friSat'))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-2">Curfew never progresses past midnight. Quiet hours run from curfew to {fmtTime(CANON.curfew.quietEnd)}.</p>
      </section>
      <section>
        <h2 className="font-serif text-xl mb-3">Program fees</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {([['Double (shared) room', CANON.fees.double], ['Single (private) room', CANON.fees.single]] as const).map(([label, f]) => (
            <div key={label} className="bg-white rounded-2xl border border-line p-5">
              <div className="font-semibold">{label}</div>
              <div className="text-2xl font-serif mt-1">{money(f.weekly)}<span className="text-sm text-muted">/week</span></div>
              <div className="text-sm text-muted">or {money(f.monthlyPrepaid)}/month when paid in advance in full</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">Deposit &amp; refund terms are pending a leadership decision (GH-D004).</p>
      </section>
    </div>
  );
}
