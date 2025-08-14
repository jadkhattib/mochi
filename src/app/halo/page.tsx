"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { 
  filterRecords,
  toChannelSynergyMatrix,
  toBrandHaloAnalysis,
  toTemporalSynergyAnalysis,
  toPortfolioCorrelationAnalysis,
  toMediaSyncTable,
  toCrossChannelLiftAnalysis,
  toOptimalTimingRecommendations,
  sampleData
} from "@/lib/transform";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, Cell, ComposedChart, Area } from "recharts";

export default function HaloSynergyPage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();
  
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);
  
  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  const synergyMatrix = data ? toChannelSynergyMatrix(data) : [];
  const brandHalo = data ? toBrandHaloAnalysis(data, selectedBrand) : [];
  const temporalSynergy = sampleData(toTemporalSynergyAnalysis(filtered), 100);
  const portfolioCorrelation = toPortfolioCorrelationAnalysis(filtered);
  const mediaSyncTable = data ? toMediaSyncTable(data) : [];
  const crossChannelLift = toCrossChannelLiftAnalysis(filtered);
  const timingRecommendations = toOptimalTimingRecommendations(filtered);

  const colors = ["#2d2d2d", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"];

  // Calculate insights
  const strongestSynergy = synergyMatrix.length > 0 ? synergyMatrix[0] : null;
  const strongestHalo = brandHalo.length > 0 ? brandHalo[0] : null;
  const avgSynergyIndex = temporalSynergy.length > 0 ? 
    temporalSynergy.reduce((sum, d) => sum + d.synergyIndex, 0) / temporalSynergy.length : 0;
  const highSynergyPairs = synergyMatrix.filter(s => s.liftPercent > 15).length;

  // Transform synergy matrix for heatmap visualization
  const synergyHeatmapData = synergyMatrix.slice(0, 8).map((item, index) => ({
    name: `${item.channel1} + ${item.channel2}`,
    synergy: item.synergyScore,
    lift: item.liftPercent,
    index
  }));

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Halo & Synergy</h2>
        <p className="text-sm text-black/70">Cross-brand halo effects, channel synergies, and optimal activation timing</p>
      </header>

      {/* Strategic Halo & Synergy Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Halo & Synergy Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Channel Coordination</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Strongest synergy: <strong>{strongestSynergy ? `${strongestSynergy.channel1} + ${strongestSynergy.channel2}` : "TV + Digital"}</strong></li>
              <li>• Coordinate launches within {avgSynergyIndex > 0.15 ? "1-2 weeks" : "2-4 weeks"} for maximum synergy</li>
              <li>• Focus budget on high-synergy channel pairs first</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Brand Portfolio</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Top halo brand: <strong>{strongestHalo?.sourceBrand || "Brand A"}</strong></li>
              <li>• Cross-brand campaigns show {avgSynergyIndex > 0.1 ? "positive" : "neutral"} lift</li>
              <li>• Leverage {strongestHalo?.sourceBrand || "leading brand"} to support portfolio brands</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Activation Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Synchronize high-impact channels during key moments</li>
              <li>• Stagger secondary channels for sustained momentum</li>
              <li>• Monitor cross-channel frequency caps to avoid oversaturation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Halo & Synergy Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Strongest Synergy</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">+{strongestSynergy?.liftPercent.toFixed(0) || "0"}%</p>
          <p className="text-xs text-black/60 mt-1">{strongestSynergy ? `${strongestSynergy.channel1} + ${strongestSynergy.channel2}` : "N/A"}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Top Brand Halo</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{strongestHalo?.haloEffect.toFixed(2) || "0.00"}</p>
          <p className="text-xs text-black/60 mt-1">{strongestHalo ? `${strongestHalo.sourceBrand} → ${strongestHalo.targetBrand}` : "N/A"}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Avg Synergy Index</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{avgSynergyIndex.toFixed(2)}</p>
          <p className="text-xs text-black/60 mt-1">Cross-channel coordination</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">High Synergy Pairs</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{highSynergyPairs}</p>
          <p className="text-xs text-black/60 mt-1">Channels with &gt;15% lift</p>
        </div>
      </div>

      {/* Channel Synergy Matrix & Brand Halo Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Channel Synergy Matrix</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={synergyHeatmapData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'lift' ? `+${value.toFixed(1)}%` : value.toFixed(2)) : value, 
                  name === 'synergy' ? 'Synergy Score' : name === 'lift' ? 'Lift %' : name
                ]}
              />
              <Bar dataKey="lift" name="Lift %">
                {synergyHeatmapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.lift > 25 ? "#2d2d2d" : entry.lift > 15 ? "#8884d8" : "#82ca9d"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Brand-to-Brand Halo Effects</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart data={brandHalo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="haloEffect" name="Halo Effect" tick={{ fontSize: 12 }} />
              <YAxis dataKey="incrementalNR" name="Incremental NR" tick={{ fontSize: 12 }} />
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
                  name === 'haloEffect' ? 'Halo Effect' : name === 'incrementalNR' ? 'Incremental NR' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.sourceBrand} → ${data.targetBrand}`;
                  }
                  return '';
                }}
              />
              <Scatter 
                data={brandHalo} 
                fill="#2d2d2d"
                name="Brand Halo"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Temporal Synergy Analysis */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Temporal Synergy Analysis - TV & Digital Coordination</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={temporalSynergy}>
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
                name === 'tvSpend' ? 'TV Spend' : name === 'digitalSpend' ? 'Digital Spend' : 
                name === 'totalNR' ? 'Total NR' : name === 'synergyIndex' ? 'Synergy Index' : name
              ]}
            />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="tvSpend" stackId="1" stroke="#2d2d2d" fill="#2d2d2d" fillOpacity={0.3} name="TV Spend" />
            <Area yAxisId="left" type="monotone" dataKey="digitalSpend" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Digital Spend" />
            <Line yAxisId="right" type="monotone" dataKey="synergyIndex" stroke="#ff7300" strokeWidth={3} name="Synergy Index" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Portfolio Correlation & Cross-Channel Lift */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Portfolio Brand Correlation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={portfolioCorrelation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="brand" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(2) : value, 
                  name === 'correlationStrength' ? 'Correlation Strength' : name === 'roi' ? 'ROI' : name
                ]}
              />
              <Bar dataKey="correlationStrength" name="Correlation Strength">
                {portfolioCorrelation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Cross-Channel Lift Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={crossChannelLift} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="baseChannel" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'incrementalLift' ? `+${value.toFixed(1)}%` : value.toFixed(2)) : value, 
                  name === 'incrementalLift' ? 'Incremental Lift' : name === 'baseROI' ? 'Base ROI' : name === 'liftedROI' ? 'Lifted ROI' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.baseChannel} + ${data.supportChannel}`;
                  }
                  return '';
                }}
              />
              <Bar dataKey="incrementalLift" name="Incremental Lift %">
                {crossChannelLift.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.incrementalLift > 30 ? "#2d2d2d" : entry.incrementalLift > 20 ? "#8884d8" : "#82ca9d"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Media Synchronization Table */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Media Synchronization Impact Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 px-3 font-medium">Channel Pair</th>
                <th className="text-center py-2 px-3 font-medium">Optimal Lag</th>
                <th className="text-right py-2 px-3 font-medium">Lift When Synced</th>
                <th className="text-left py-2 px-3 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {mediaSyncTable.slice(0, 8).map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 hover:bg-black/5">
                  <td className="py-2 px-3 font-medium">{row.channel1} + {row.channel2}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs">
                      {row.optimalLag === 0 ? "Same day" : `${row.optimalLag} days`}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className={`font-bold ${
                      row.liftWhenSynced > 25 ? "text-green-600" :
                      row.liftWhenSynced > 15 ? "text-blue-600" :
                      row.liftWhenSynced > 5 ? "text-yellow-600" :
                      "text-gray-600"
                    }`}>
                      +{row.liftWhenSynced.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.recommendation.includes("High Priority") ? "bg-green-100 text-green-800" :
                      row.recommendation.includes("Medium Priority") ? "bg-blue-100 text-blue-800" :
                      row.recommendation.includes("Low Priority") ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {row.recommendation.split(":")[0]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optimal Timing Recommendations */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Optimal Activation Timing Playbook</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timingRecommendations.map((rec, idx) => (
            <div key={idx} className="border border-black/10 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm">{rec.scenario}</h4>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  rec.confidence === "High" ? "bg-green-100 text-green-800" :
                  rec.confidence === "Medium" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {rec.confidence} Confidence
                </span>
              </div>
              <div className="space-y-1 text-xs text-black/70">
                <p><strong>Timing:</strong> {rec.timing}</p>
                <p><strong>Expected Lift:</strong> <span className="font-bold text-green-600">+{rec.expectedLift}%</span></p>
                <p><strong>Action:</strong> {rec.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Halo & Synergy Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Halo & Synergy Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Channel Coordination</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Strongest synergy: <strong>{strongestSynergy ? `${strongestSynergy.channel1} + ${strongestSynergy.channel2}` : "TV + Digital"}</strong></li>
              <li>• Activate high-synergy pairs (+{strongestSynergy?.liftPercent?.toFixed(0) || "25"}% lift) simultaneously</li>
              <li>• Coordinate {highSynergyPairs} channel pairs with &gt;15% synergy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Brand Portfolio</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Top halo brand: <strong>{strongestHalo?.sourceBrand || "Brand A"}</strong></li>
              <li>• Cross-brand campaigns show {avgSynergyIndex > 0.1 ? "positive" : "neutral"} lift</li>
              <li>• Leverage {strongestHalo?.sourceBrand || "leading brand"} to support portfolio brands</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Activation Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Synchronize high-impact channels during key moments</li>
              <li>• Stagger secondary channels for sustained momentum</li>
              <li>• Monitor cross-channel frequency caps to avoid oversaturation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
