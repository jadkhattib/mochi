interface KpiProps {
  title: string;
  value: string | number;
  sub?: string;
}

function KpiCard({ title, value, sub }: KpiProps) {
  return (
    <div className="rounded-xl bg-white border border-black/10 p-4">
      <div className="text-xs text-black/70">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub ? <div className="text-xs text-black/60 mt-1">{sub}</div> : null}
    </div>
  );
}

export function KPIGroup({ totalSpend, totalNR, avgROI }: { totalSpend: number; totalNR: number; avgROI: number }) {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
      <KpiCard title="Total Spend" value={`$${(totalSpend / 1_000_000).toFixed(2)}M`} />
      <KpiCard title="Total NR" value={`$${(totalNR / 1_000_000).toFixed(2)}M`} />
      <KpiCard title="Avg ROI" value={avgROI.toFixed(2)} sub="NR / Spend" />
    </div>
  );
}


