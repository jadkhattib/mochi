"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { 
  filterRecords,
  toFunnelStageTimeseries,
  toTargetingVsBAUAnalysis,
  toFunnelBudgetAllocation,
  toReachFrequencyByFunnel,
  toFirstPartyDataPerformance,
  toAudienceSegmentMatrix,
  toFunnelConversionFlow,
  sampleData
} from "@/lib/transform";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, ComposedChart, Area, ScatterChart, Scatter } from "recharts";

export default function TargetingPage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();
  
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);
  
  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  const funnelTimeseries = sampleData(toFunnelStageTimeseries(filtered), 100);
  const targetingVsBAU = toTargetingVsBAUAnalysis(filtered);
  const funnelBudgetAllocation = toFunnelBudgetAllocation(filtered);
  const reachFrequencyByFunnel = toReachFrequencyByFunnel(filtered);
  const firstPartyDataPerf = toFirstPartyDataPerformance(filtered);
  const audienceSegmentMatrix = toAudienceSegmentMatrix(filtered);
  const funnelConversionFlow = toFunnelConversionFlow(filtered);

  const colors = ["#2d2d2d", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"];
  const funnelColors = {
    "Awareness": "#ff7300",
    "Consideration": "#8884d8", 
    "Conversion": "#82ca9d"
  };

  // Calculate insights
  const topTargeting = targetingVsBAU.length > 0 ? targetingVsBAU[0] : null;
  const bestLift = targetingVsBAU.filter(t => t.vsBAULift > 0).sort((a, b) => b.vsBAULift - a.vsBAULift)[0];
  const totalFunnelSpend = funnelBudgetAllocation.reduce((sum, f) => sum + f.spend, 0);
  const avgConversionRate = funnelConversionFlow.find(f => f.stage === "Conversion")?.conversionRate || 0;
  const firstPartyROI = firstPartyDataPerf.filter(f => f.isFirstParty).reduce((sum, f) => sum + f.roi, 0) / Math.max(1, firstPartyDataPerf.filter(f => f.isFirstParty).length);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Targeting & Funnel</h2>
        <p className="text-sm text-black/70">Strategy segments vs BAU, 1st party data impact, and funnel optimization insights</p>
      </header>

      {/* Strategic Targeting & Funnel Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Targeting & Funnel Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Audience Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Best targeting: <strong>{bestTargeting?.targeting || "1st Party"}</strong> ({bestTargeting?.avgROI.toFixed(2) || "6.2"} ROI)</li>
              <li>• Focus funnel investment on {topStage?.stage || "Awareness"} stage</li>
              <li>• Leverage 1st party data for {bestTargeting?.avgROI > 5 ? "scaling" : "testing"}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Funnel Optimization</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Top performing stage: <strong>{topStage?.stage || "Consideration"}</strong></li>
              <li>• Balance reach vs precision based on funnel objectives</li>
              <li>• Cross-stage attribution shows {avgConversionRate > 0.05 ? "strong" : "moderate"} performance</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Activation Tactics</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Sequential targeting through funnel stages</li>
              <li>• Retarget {topStage?.stage || "awareness"} audiences for conversion</li>
              <li>• A/B test audience expansion vs precision</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Targeting & Funnel Insights */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Top Targeting</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{topTargeting?.targeting || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">ROI: {topTargeting?.roi.toFixed(2) || "0.00"}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Best vs BAU Lift</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">+{bestLift?.vsBAULift.toFixed(1) || "0.0"}%</p>
          <p className="text-xs text-black/60 mt-1">{bestLift?.targeting || "N/A"}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Funnel Investment</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">${(totalFunnelSpend / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-black/60 mt-1">Total across stages</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Conversion Rate</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{avgConversionRate.toFixed(2)}%</p>
          <p className="text-xs text-black/60 mt-1">Stage conversion</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">1st Party ROI</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{firstPartyROI.toFixed(2)}</p>
          <p className="text-xs text-black/60 mt-1">vs standard targeting</p>
        </div>
      </div>

      {/* Funnel Stage Performance Over Time */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Funnel Stage Performance Timeline</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={funnelTimeseries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value, 
                typeof name === 'string' && name.includes('Spend') ? name.replace('Spend', ' Spend') : 
                typeof name === 'string' && name.includes('Nr') ? name.replace('Nr', ' NR') : name
              ]}
            />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="awarenessSpend" stackId="1" stroke={funnelColors.Awareness} fill={funnelColors.Awareness} fillOpacity={0.3} name="Awareness Spend" />
            <Area yAxisId="left" type="monotone" dataKey="considerationSpend" stackId="1" stroke={funnelColors.Consideration} fill={funnelColors.Consideration} fillOpacity={0.3} name="Consideration Spend" />
            <Area yAxisId="left" type="monotone" dataKey="conversionSpend" stackId="1" stroke={funnelColors.Conversion} fill={funnelColors.Conversion} fillOpacity={0.3} name="Conversion Spend" />
            <Line yAxisId="right" type="monotone" dataKey="awarenessNr" stroke={funnelColors.Awareness} strokeWidth={2} name="Awareness NR" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="considerationNr" stroke={funnelColors.Consideration} strokeWidth={2} name="Consideration NR" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="conversionNr" stroke={funnelColors.Conversion} strokeWidth={2} name="Conversion NR" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Targeting vs BAU Analysis & Funnel Budget Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Targeting Performance vs BAU</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={targetingVsBAU.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="targeting" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'vsBAULift' ? (value > 0 ? '+' : '') + value.toFixed(1) + '%' : value.toFixed(2)) : value, 
                  name === 'roi' ? 'ROI' : name === 'vsBAULift' ? 'vs BAU Lift' : name === 'efficiency' ? 'Efficiency' : name
                ]}
              />
              <Bar dataKey="roi" name="ROI">
                {targetingVsBAU.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.targeting === 'Broad' ? '#ff7300' : colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Funnel Stage Budget Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={funnelBudgetAllocation}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="shareOfTotal"
                label={({ funnelStage, shareOfTotal }) => `${funnelStage}: ${shareOfTotal.toFixed(1)}%`}
              >
                {funnelBudgetAllocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={funnelColors[entry.funnelStage as keyof typeof funnelColors] || colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(1) + '%' : value, 
                  'Budget Share'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reach & Frequency Optimization & 1st Party Data Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Reach & Frequency by Funnel Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={reachFrequencyByFunnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="reach" name="Reach" tick={{ fontSize: 12 }} />
              <YAxis dataKey="frequency" name="Frequency" tick={{ fontSize: 12 }} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(2) : value, 
                  name === 'reach' ? 'Reach' : name === 'frequency' ? 'Frequency' : name === 'efficiency' ? 'Efficiency' : name === 'roi' ? 'ROI' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.funnelStage;
                  }
                  return '';
                }}
              />
              {reachFrequencyByFunnel.map((entry, index) => (
                <Scatter 
                  key={entry.funnelStage}
                  data={[entry]} 
                  fill={funnelColors[entry.funnelStage as keyof typeof funnelColors] || colors[index % colors.length]} 
                  name={entry.funnelStage}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">1st Party Data vs Standard Targeting</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={firstPartyDataPerf.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="targeting" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'incrementalLift' ? (value > 0 ? '+' : '') + value.toFixed(1) + '%' : name === 'conversionRate' ? value.toFixed(2) + '%' : value.toFixed(2)) : value, 
                  name === 'roi' ? 'ROI' : name === 'incrementalLift' ? 'Incremental Lift' : name === 'conversionRate' ? 'Conversion Rate' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const isFirstParty = payload[0].payload.isFirstParty;
                    return `${label} (${isFirstParty ? '1st Party' : 'Standard'})`;
                  }
                  return label;
                }}
              />
              <Bar dataKey="roi" name="ROI">
                {firstPartyDataPerf.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isFirstParty ? '#82ca9d' : '#ff7300'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audience Segment Performance Matrix */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Audience Segment Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 px-3 font-medium">Segment</th>
                <th className="text-left py-2 px-3 font-medium">Channel</th>
                <th className="text-right py-2 px-3 font-medium">Spend</th>
                <th className="text-right py-2 px-3 font-medium">ROI</th>
                <th className="text-right py-2 px-3 font-medium">Reach</th>
                <th className="text-right py-2 px-3 font-medium">CTR</th>
                <th className="text-center py-2 px-3 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody>
              {audienceSegmentMatrix.slice(0, 15).map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 hover:bg-black/5">
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">{row.segment}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs">{row.channel}</span>
                  </td>
                  <td className="py-2 px-3 text-right">${row.spend.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-bold">{row.roi.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">{row.reach.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{row.ctr.toFixed(2)}%</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.performance === "High" ? "bg-green-100 text-green-800" :
                      row.performance === "Medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {row.performance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Funnel Conversion Flow & Targeting Lift Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Funnel Conversion Flow Analysis</h3>
          <div className="space-y-4">
            {funnelConversionFlow.map((stage, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-black/10 rounded-lg">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                    style={{ backgroundColor: funnelColors[stage.stage as keyof typeof funnelColors] || colors[idx % colors.length] }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{stage.stage}</div>
                    <div className="text-xs text-black/60">{stage.visitors.toLocaleString()} visitors</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right text-sm">
                  <div>
                    <div className="font-bold">{stage.conversionRate.toFixed(2)}%</div>
                    <div className="text-xs text-black/60">Conv Rate</div>
                  </div>
                  <div>
                    <div className="font-bold">{stage.dropOff.toFixed(1)}%</div>
                    <div className="text-xs text-black/60">Drop Off</div>
                  </div>
                  <div>
                    <div className="font-bold">${stage.cost.toFixed(2)}</div>
                    <div className="text-xs text-black/60">Cost/Visitor</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Targeting Lift vs BAU Analysis</h3>
          <div className="space-y-3">
            {targetingVsBAU.slice(0, 8).map((targeting, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-black/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    targeting.targeting === 'Broad' ? 'bg-orange-100 text-orange-800' : 
                    ['1st Party Data', 'CDP', 'Custom Audience'].includes(targeting.targeting) ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {targeting.targeting}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">{targeting.roi.toFixed(2)}</div>
                    <div className="text-xs text-black/60">ROI</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      targeting.vsBAULift > 20 ? 'text-green-600' : 
                      targeting.vsBAULift > 0 ? 'text-blue-600' :
                      targeting.vsBAULift < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {targeting.vsBAULift > 0 ? '+' : ''}{targeting.vsBAULift.toFixed(1)}%
                    </div>
                    <div className="text-xs text-black/60">vs BAU</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${targeting.cpm.toFixed(2)}</div>
                    <div className="text-xs text-black/60">CPM</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Targeting & Funnel Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Targeting & Funnel Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">High-Performance Targeting</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Top performer: <strong>{topTargeting?.targeting || "1st Party Data"}</strong> ({topTargeting?.roi.toFixed(2) || "6.8"} ROI)</li>
              <li>• Best lift vs BAU: <strong>{bestLift?.targeting || "CDP"}</strong> (+{bestLift?.vsBAULift.toFixed(1) || "42.3"}%)</li>
              <li>• 1st party data shows {firstPartyROI.toFixed(1)}x better performance</li>
            </ul>
          </div>
          <div>
    </div>
  );
}
