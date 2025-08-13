import { ChannelParams } from "@/lib/types";

export function ChannelParamsTable({ params }: { params: ChannelParams[] }) {
  return (
    <div className="rounded-xl bg-white border border-black/10 p-3 overflow-x-auto">
      <h3 className="text-sm font-medium mb-2">Channel parameters</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-black/70">
            <th className="py-2 pr-4">Channel</th>
            <th className="py-2 pr-4">Half-life (d)</th>
            <th className="py-2 pr-4">Min Threshold</th>
            <th className="py-2 pr-4">Max Marginal ROI</th>
            <th className="py-2 pr-4">Max ROI</th>
            <th className="py-2 pr-4">Saturation Spend</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.channel} className="border-t border-black/5">
              <td className="py-2 pr-4 whitespace-nowrap">{p.channel}</td>
              <td className="py-2 pr-4">{p.halfLifeDays ?? "-"}</td>
              <td className="py-2 pr-4">${p.minThresholdSpend.toLocaleString()}</td>
              <td className="py-2 pr-4">{p.maxMarginalROI.toFixed(2)}</td>
              <td className="py-2 pr-4">{p.maxROI.toFixed(2)}</td>
              <td className="py-2 pr-4">${p.saturationPointSpend.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


