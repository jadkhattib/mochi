"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { 
  filterRecords, 
  toDaypartPrimeRatio, 
  toTVvsCTVTimeseries,
  toLinearVsCTVROIScatter,
  toPrimeVsNonPrimePerformance,
  toBVODSVODAVODBreakdown,
  toReachFrequencyOptimization,
  toDaypartPerformanceTable,
  sampleData
} from "@/lib/transform";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, Cell } from "recharts";

export default function TVCTVPage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();
  
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);
  
  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  const prime = toDaypartPrimeRatio(filtered);
  const tvCtvTimeseries = sampleData(toTVvsCTVTimeseries(filtered), 100);
  const roiScatter = sampleData(toLinearVsCTVROIScatter(filtered), 200);
  const primePerformance = toPrimeVsNonPrimePerformance(filtered);
  const platformBreakdown = toBVODSVODAVODBreakdown(filtered);
  const reachFreqOptimization = sampleData(toReachFrequencyOptimization(filtered), 50);
  const daypartTable = toDaypartPerformanceTable(filtered);

  const colors = ["#2d2d2d", "#f3f2ef", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">TV & CTV Activation</h2>
        <p className="text-sm text-black/70">Linear TV vs CTV performance, Prime Time optimization, BVOD/SVOD/AVOD analysis</p>
      </header>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Prime Time Ratio</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">
            {(prime.prime / Math.max(1, prime.prime + prime.offPrime) * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-black/60 mt-1">Current spend allocation</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">TV vs CTV Split</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">
            {tvCtvTimeseries.length > 0 ? 
              ((tvCtvTimeseries.reduce((s, d) => s + d.tvSpend, 0) / 
                Math.max(1, tvCtvTimeseries.reduce((s, d) => s + d.tvSpend + d.ctvSpend, 0))) * 100).toFixed(0) 
              : 0}% TV
          </p>
          <p className="text-xs text-black/60 mt-1">Linear TV share of video</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Best Platform ROI</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">
            {platformBreakdown.length > 0 ? 
              Math.max(...platformBreakdown.map(p => p.roi)).toFixed(1) : "0.0"}
          </p>
          <p className="text-xs text-black/60 mt-1">
            {platformBreakdown.length > 0 ? 
              platformBreakdown.reduce((max, p) => p.roi > max.roi ? p : max, platformBreakdown[0]).platform
              : "N/A"}
          </p>
        </div>
      </div>

      {/* TV vs CTV Performance Timeline */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">TV vs CTV Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tvCtvTimeseries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px',
                fontSize: '12px'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="tvNr" stroke="#2d2d2d" strokeWidth={2} name="Linear TV NR" dot={false} />
            <Line type="monotone" dataKey="ctvNr" stroke="#8884d8" strokeWidth={2} name="CTV/OLV NR" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Linear vs CTV ROI Scatter & Prime Time Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Reach vs Frequency Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={roiScatter}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="reach" name="Reach %" tick={{ fontSize: 12 }} />
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
                  name === 'reach' ? 'Reach %' : name === 'frequency' ? 'Frequency' : name
                ]}
              />
              <Scatter 
                data={roiScatter.filter(d => d.type === "Linear")} 
                fill="#2d2d2d" 
                name="Linear TV"
              />
              <Scatter 
                data={roiScatter.filter(d => d.type === "CTV")} 
                fill="#8884d8" 
                name="CTV/OLV"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Prime vs Non-Prime Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={primePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="daypart" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toLocaleString() : value, 
                  name === 'roi' ? 'ROI' : name === 'reach' ? 'Reach %' : name
                ]}
              />
              <Bar dataKey="roi" name="ROI">
                {primePerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.daypart === "Prime" ? "#2d2d2d" : "#8884d8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Reach vs Frequency Trends - Expanded */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Weekly Reach vs Frequency Trends</h3>
        
        {/* Key Metrics Row */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Avg Weekly Reach</div>
            <div className="text-lg font-bold text-blue-800">
              {reachFreqOptimization.length > 0 ? 
                (reachFreqOptimization.reduce((sum, d) => sum + d.reach, 0) / reachFreqOptimization.length).toFixed(1) : '0'}%
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-xs text-green-600 font-medium">Avg Frequency</div>
            <div className="text-lg font-bold text-green-800">
              {reachFreqOptimization.length > 0 ? 
                (reachFreqOptimization.reduce((sum, d) => sum + d.frequency, 0) / reachFreqOptimization.length).toFixed(1) : '0'}
            </div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-xs text-orange-600 font-medium">Peak Efficiency</div>
            <div className="text-lg font-bold text-orange-800">
              {reachFreqOptimization.length > 0 ? 
                Math.max(...reachFreqOptimization.map(d => d.efficiency)).toFixed(1) : '0'}
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-xs text-purple-600 font-medium">Optimal Week</div>
            <div className="text-lg font-bold text-purple-800">
              {reachFreqOptimization.length > 0 ? 
                reachFreqOptimization.reduce((max, d) => d.efficiency > max.efficiency ? d : max, reachFreqOptimization[0]).week : 'N/A'}
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={reachFreqOptimization}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
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
                typeof value === 'number' ? value.toFixed(1) : value, 
                name === 'reach' ? 'Reach %' : name === 'frequency' ? 'Frequency' : name === 'efficiency' ? 'Efficiency' : name
              ]}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="reach" stroke="#2d2d2d" strokeWidth={3} name="Reach %" dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="frequency" stroke="#8884d8" strokeWidth={3} name="Frequency" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={3} name="Efficiency" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Analysis Insights */}
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-black/80 mb-2">Reach & Frequency Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-black/60">
            <div className="space-y-1">
              <div>• <strong>Reach Trend:</strong> {reachFreqOptimization.length > 2 && reachFreqOptimization[reachFreqOptimization.length-1].reach > reachFreqOptimization[0].reach ? 'Growing' : 'Declining'} over time</div>
              <div>• <strong>Frequency Balance:</strong> {reachFreqOptimization.length > 0 && (reachFreqOptimization.reduce((sum, d) => sum + d.frequency, 0) / reachFreqOptimization.length) > 3 ? 'High frequency strategy' : 'Reach-focused approach'}</div>
              <div>• <strong>Efficiency Pattern:</strong> {reachFreqOptimization.length > 1 ? 'Variable across weeks' : 'Consistent performance'}</div>
            </div>
            <div className="space-y-1">
              <div>• <strong>Optimal Timing:</strong> Week {reachFreqOptimization.length > 0 ? reachFreqOptimization.reduce((max, d) => d.efficiency > max.efficiency ? d : max, reachFreqOptimization[0]).week : 'N/A'} shows peak efficiency</div>
              <div>• <strong>Reach Ceiling:</strong> {reachFreqOptimization.length > 0 ? Math.max(...reachFreqOptimization.map(d => d.reach)).toFixed(1) : '0'}% maximum weekly reach achieved</div>
              <div>• <strong>Strategy:</strong> {reachFreqOptimization.length > 0 && (reachFreqOptimization.reduce((sum, d) => sum + d.frequency, 0) / reachFreqOptimization.length) > 2.5 ? 'Consider reach expansion' : 'Optimize frequency capping'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daypart Performance Table */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Daypart Performance Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 px-3 font-medium">Daypart</th>
                <th className="text-right py-2 px-3 font-medium">Spend</th>
                <th className="text-right py-2 px-3 font-medium">Reach %</th>
                <th className="text-right py-2 px-3 font-medium">Frequency</th>
                <th className="text-right py-2 px-3 font-medium">CPM</th>
                <th className="text-right py-2 px-3 font-medium">ROI</th>
                <th className="text-right py-2 px-3 font-medium">Premium Ratio</th>
              </tr>
            </thead>
            <tbody>
              {daypartTable.map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 hover:bg-black/5">
                  <td className="py-2 px-3 font-medium">{row.daypart}</td>
                  <td className="py-2 px-3 text-right">${row.spend.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">{row.reach.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right">{row.frequency.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right">${row.cpm.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">{row.roi.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={row.premiumRatio > 1.2 ? "text-red-600" : row.premiumRatio < 0.8 ? "text-green-600" : ""}>
                      {row.premiumRatio.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-black/60 mt-3">
          Premium Ratio shows CPM relative to Off-Prime. Values &gt;1.2x indicate significant premium, &lt;0.8x indicate efficiency opportunities.
        </p>
      </div>

      {/* Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">TV & CTV Activation Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Prime Time Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Current prime ratio: <strong>{(prime.prime / Math.max(1, prime.prime + prime.offPrime) * 100).toFixed(0)}%</strong></li>
              <li>• Consider {prime.prime > prime.offPrime ? "reducing" : "increasing"} prime allocation based on ROI</li>
              <li>• Test daypart rotation for frequency management</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Platform Mix Optimization</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Best performing platform: <strong>{platformBreakdown.length > 0 ? platformBreakdown.reduce((max, p) => p.roi > max.roi ? p : max, platformBreakdown[0]).platform : "N/A"}</strong></li>
              <li>• Consider CTV for precise targeting with frequency caps</li>
              <li>• Linear TV for mass reach during peak moments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


