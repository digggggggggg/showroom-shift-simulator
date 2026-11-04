import type { Stats } from '../game';

const GBP = '\u00A3';

export function KpiRow({ stats }: { readonly stats: Stats }) {
  const cards = [
    { label: 'CAPTURED', value: `${GBP}${stats.captured}`, tone: '' },
    { label: 'WALKOUTS', value: `${GBP}${stats.lost}`, tone: 'red' },
    { label: 'UNMANNED', value: `${Math.floor(stats.unmannedSeconds)}s`, tone: 'gold' },
    { label: 'HUB ORDERS', value: `${stats.hubOrders}`, tone: 'blue' },
  ];
  return (
    <div className="kpi-row">
      {cards.map((c) => (
        <div key={c.label} className="kpi-card">
          <span>{c.label}</span>
          <strong className={`kpi-val ${c.tone}`.trim()}>{c.value}</strong>
        </div>
      ))}
    </div>
  );
}
