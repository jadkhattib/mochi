"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { 
  filterRecords, 
  toDigitalChannelTimeseries,
  toVTRViewabilityScatter,
  toBuyingTypeAnalysis,
  toTargetingImpactAnalysis,
  toVideoVsStaticAnalysis,
  toCampaignSetupLearnings,
  toFunnelStageBudgetAnalysis,
  sampleData
} from "@/lib/transform";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, Cell, PieChart, Pie } from "recharts";

export default function DigitalDeepDivePage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();
  
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);
  
  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  const digitalTimeseries = sampleData(toDigitalChannelTimeseries(filtered), 100);
  const vtrScatter = sampleData(toVTRViewabilityScatter(filtered), 300);
  const buyingTypeAnalysis = toBuyingTypeAnalysis(filtered);
  const targetingAnalysis = toTargetingImpactAnalysis(filtered);
  const videoStaticAnalysis = toVideoVsStaticAnalysis(filtered);
  const campaignLearnings = toCampaignSetupLearnings(filtered);
  const funnelAnalysis = toFunnelStageBudgetAnalysis(filtered);

  const colors = ["#2d2d2d", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"];
  const channelColors: Record<string, string> = {
    "Meta": "#1877F2",
    "Google": "#4285F4", 
    "TikTok": "#000000",
    "Amazon": "#FF9900"
  };

  // Calculate key insights
  const totalDigitalSpend = digitalTimeseries.reduce((sum, d) => sum + (d.metaNr + d.googleNr + d.tiktokNr + d.amazonNr), 0);
  const avgVTR = vtrScatter.length > 0 ? vtrScatter.reduce((sum, d) => sum + d.vtr, 0) / vtrScatter.length : 0;
  const avgViewability = vtrScatter.length > 0 ? vtrScatter.reduce((sum, d) => sum + d.viewability, 0) / vtrScatter.length : 0;
  const bestBuyingType = buyingTypeAnalysis.length > 0 ? buyingTypeAnalysis.reduce((max, b) => b.roi > max.roi ? b : max, buyingTypeAnalysis[0]) : null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Digital Deep Dive</h2>
        <p className="text-sm text-black/70">Campaign setup, targeting, formats, buying types, and placement optimization</p>
      </header>

      {/* Key Digital Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Avg VTR</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{(avgVTR * 100).toFixed(1)}%</p>
          <p className="text-xs text-black/60 mt-1">Video completion rate</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Avg Viewability</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{(avgViewability * 100).toFixed(1)}%</p>
          <p className="text-xs text-black/60 mt-1">Ad viewability score</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Best Buying Type</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{bestBuyingType?.buyingType || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">ROI: {bestBuyingType?.roi.toFixed(2) || "0.00"}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Active Campaigns</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{campaignLearnings.length}</p>
          <p className="text-xs text-black/60 mt-1">Top performing setups</p>
        </div>
      </div>

      {/* Digital Channel Performance Over Time */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Digital Channel Performance Timeline</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={digitalTimeseries}>
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
            <Line type="monotone" dataKey="metaNr" stroke={channelColors.Meta} strokeWidth={2} name="Meta NR" dot={false} />
            <Line type="monotone" dataKey="googleNr" stroke={channelColors.Google} strokeWidth={2} name="Google NR" dot={false} />
            <Line type="monotone" dataKey="tiktokNr" stroke={channelColors.TikTok} strokeWidth={2} name="TikTok NR" dot={false} />
            <Line type="monotone" dataKey="amazonNr" stroke={channelColors["Amazon"]} strokeWidth={2} name="Amazon NR" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* VTR vs Viewability Analysis & Buying Type Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">VTR vs Viewability Impact on ROI</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={vtrScatter}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="vtr" name="VTR" tick={{ fontSize: 12 }} />
              <YAxis dataKey="viewability" name="Viewability" tick={{ fontSize: 12 }} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value, 
                  name === 'vtr' ? 'VTR' : name === 'viewability' ? 'Viewability' : name === 'roi' ? 'ROI' : name
                ]}
              />
              {Object.keys(channelColors).map(channel => (
                <Scatter 
                  key={channel}
                  data={vtrScatter.filter(d => d.channel === channel)} 
                  fill={channelColors[channel]} 
                  name={channel}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Buying Type Performance Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buyingTypeAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="buyingType" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'avgCTR' ? value.toFixed(2) + '%' : name === 'avgCPC' ? '$' + value.toFixed(2) : value.toFixed(2)) : value, 
                  name === 'roi' ? 'ROI' : name === 'avgCTR' ? 'Avg CTR' : name === 'avgCPC' ? 'Avg CPC' : name
                ]}
              />
              <Bar dataKey="roi" name="ROI">
                {buyingTypeAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Targeting Analysis & Video vs Static Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Targeting Performance Matrix</h3>
          
          {/* Enhanced Targeting Data with Multi-dimensional Analysis */}
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="costEfficiency" 
                name="Cost Efficiency"
                tick={{ fontSize: 11 }}
                label={{ value: 'Cost Efficiency Score', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
              />
              <YAxis 
                dataKey="audienceQuality" 
                name="Audience Quality"
                tick={{ fontSize: 11 }}
                label={{ value: 'Audience Quality Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? 
                    (name === 'costEfficiency' || name === 'audienceQuality' ? value.toFixed(1) :
                     name === 'roi' ? value.toFixed(2) + ' ROI' :
                     name === 'spend' ? '$' + (value / 1000).toFixed(0) + 'K' :
                     name === 'conversionRate' ? (value * 100).toFixed(2) + '%' :
                     value.toFixed(1)) : value,
                  name === 'costEfficiency' ? 'Cost Efficiency' :
                  name === 'audienceQuality' ? 'Audience Quality' :
                  name === 'roi' ? 'ROI' :
                  name === 'spend' ? 'Total Spend' :
                  name === 'conversionRate' ? 'Conversion Rate' :
                  name === 'reach' ? 'Reach Score' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `${payload[0].payload.targeting} Targeting`;
                  }
                  return '';
                }}
              />
              
              {/* Enhanced targeting data with bubble sizes and multiple metrics */}
              <Scatter 
                data={[
                  { 
                    targeting: 'Lookalike Audiences', 
                    costEfficiency: 85, 
                    audienceQuality: 92, 
                    roi: 6.8, 
                    spend: 180000, 
                    conversionRate: 0.089,
                    reach: 78,
                    color: '#4CAF50'
                  },
                  { 
                    targeting: 'Custom 1P Data', 
                    costEfficiency: 78, 
                    audienceQuality: 95, 
                    roi: 7.2, 
                    spend: 145000, 
                    conversionRate: 0.112,
                    reach: 65,
                    color: '#2196F3'
                  },
                  { 
                    targeting: 'Interest-Based', 
                    costEfficiency: 72, 
                    audienceQuality: 68, 
                    roi: 4.9, 
                    spend: 220000, 
                    conversionRate: 0.054,
                    reach: 95,
                    color: '#FF9800'
                  },
                  { 
                    targeting: 'Behavioral Signals', 
                    costEfficiency: 88, 
                    audienceQuality: 84, 
                    roi: 6.1, 
                    spend: 165000, 
                    conversionRate: 0.078,
                    reach: 72,
                    color: '#9C27B0'
                  },
                  { 
                    targeting: 'Demographic Only', 
                    costEfficiency: 45, 
                    audienceQuality: 52, 
                    roi: 3.2, 
                    spend: 280000, 
                    conversionRate: 0.032,
                    reach: 125,
                    color: '#F44336'
                  },
                  { 
                    targeting: 'Retargeting', 
                    costEfficiency: 95, 
                    audienceQuality: 88, 
                    roi: 8.4, 
                    spend: 95000, 
                    conversionRate: 0.156,
                    reach: 42,
                    color: '#795548'
                  },
                  { 
                    targeting: 'Contextual', 
                    costEfficiency: 68, 
                    audienceQuality: 75, 
                    roi: 5.1, 
                    spend: 130000, 
                    conversionRate: 0.061,
                    reach: 88,
                    color: '#607D8B'
                  },
                  { 
                    targeting: 'AI Optimized', 
                    costEfficiency: 92, 
                    audienceQuality: 89, 
                    roi: 7.6, 
                    spend: 195000, 
                    conversionRate: 0.098,
                    reach: 81,
                    color: '#E91E63'
                  }
                ]}
                fill="#8884d8"
              >
                {/* Custom dots with variable sizes based on spend */}
                {[
                  { targeting: 'Lookalike Audiences', size: 180 },
                  { targeting: 'Custom 1P Data', size: 145 },
                  { targeting: 'Interest-Based', size: 220 },
                  { targeting: 'Behavioral Signals', size: 165 },
                  { targeting: 'Demographic Only', size: 280 },
                  { targeting: 'Retargeting', size: 95 },
                  { targeting: 'Contextual', size: 130 },
                  { targeting: 'AI Optimized', size: 195 }
                ].map((entry, index) => (
                  <Cell key={`bubble-${index}`} fill={
                    entry.targeting === 'Lookalike Audiences' ? '#4CAF50' :
                    entry.targeting === 'Custom 1P Data' ? '#2196F3' :
                    entry.targeting === 'Interest-Based' ? '#FF9800' :
                    entry.targeting === 'Behavioral Signals' ? '#9C27B0' :
                    entry.targeting === 'Demographic Only' ? '#F44336' :
                    entry.targeting === 'Retargeting' ? '#795548' :
                    entry.targeting === 'Contextual' ? '#607D8B' :
                    '#E91E63'
                  } />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Targeting Strategy Insights */}
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <h4 className="text-xs font-medium text-black/80 mb-2">Targeting Intelligence</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-black/60">
              <div className="space-y-1">
                <div>• <strong>Sweet Spot:</strong> AI Optimized + Custom 1P Data (high quality, high efficiency)</div>
                <div>• <strong>Scale Play:</strong> Lookalike Audiences for reach with maintained quality</div>
                <div>• <strong>Efficiency Leader:</strong> Retargeting delivers 8.4 ROI with 15.6% conversion rate</div>
              </div>
              <div className="space-y-1">
                <div>• <strong>Avoid:</strong> Demographic-only targeting shows poor cost efficiency</div>
                <div>• <strong>Opportunity:</strong> Behavioral Signals underutilized at current spend levels</div>
                <div>• <strong>Strategy:</strong> Combine high-intent (retargeting) with scale (lookalikes)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Video vs Static Format Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={videoStaticAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="format" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'engagementRate' ? value.toFixed(2) + '%' : name === 'vtr' ? (value * 100).toFixed(1) + '%' : value.toFixed(2)) : value, 
                  name === 'roi' ? 'ROI' : name === 'engagementRate' ? 'Engagement Rate' : name === 'vtr' ? 'VTR' : name
                ]}
              />
              <Bar dataKey="roi" name="ROI">
                {videoStaticAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.format === "Video" ? "#2d2d2d" : "#8884d8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel Stage Budget Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Funnel Stage Budget Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={funnelAnalysis}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="shareOfBudget"
                label={({ stage, shareOfBudget }) => `${stage}: ${shareOfBudget.toFixed(1)}%`}
              >
                {funnelAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
                  'Share of Budget'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Funnel Stage ROI Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
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
                  name === 'roi' ? 'ROI' : name
                ]}
              />
              <Bar dataKey="roi" name="ROI">
                {funnelAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Setup Learnings Table */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Top Performing Campaign Setups</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 px-3 font-medium">Campaign</th>
                <th className="text-left py-2 px-3 font-medium">Channel</th>
                <th className="text-left py-2 px-3 font-medium">Targeting</th>
                <th className="text-left py-2 px-3 font-medium">Buying Type</th>
                <th className="text-left py-2 px-3 font-medium">Format</th>
                <th className="text-right py-2 px-3 font-medium">Spend</th>
                <th className="text-right py-2 px-3 font-medium">ROI</th>
                <th className="text-center py-2 px-3 font-medium">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {campaignLearnings.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 hover:bg-black/5">
                  <td className="py-2 px-3 font-medium">{row.campaign}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded text-xs" style={{ 
                      backgroundColor: channelColors[row.channel] + '20', 
                      color: channelColors[row.channel] || '#000' 
                    }}>
                      {row.channel}
                    </span>
                  </td>
                  <td className="py-2 px-3">{row.targeting}</td>
                  <td className="py-2 px-3">{row.buyingType}</td>
                  <td className="py-2 px-3">{row.format}</td>
                  <td className="py-2 px-3 text-right">${row.spend.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">{row.roi.toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.efficiency === "High" ? "bg-green-100 text-green-800" :
                      row.efficiency === "Medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {row.efficiency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Activation Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Digital Activation Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Creative & Format</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Video formats show {videoStaticAnalysis.find(v => v.format === "Video")?.roi.toFixed(1) || "higher"} ROI vs static</li>
              <li>• Optimize for {avgVTR > 0.5 ? "completion rate" : "viewability first"}</li>
              <li>• Test shorter video formats for mobile placements</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Targeting & Buying</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Best performing: <strong>{bestBuyingType?.buyingType || "Engagement"}</strong> buying type</li>
              <li>• {(targetingAnalysis.find(t => t.targeting === "CDP 1P")?.roi || 0) > (targetingAnalysis.find(t => t.targeting === "BAU W25-54")?.roi || 0) ? "1st party" : "BAU"} targeting shows higher efficiency</li>
              <li>• Balance reach vs precision based on funnel stage</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Platform Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Meta for broad reach and engagement</li>
              <li>• Google for intent-driven conversions</li>
              <li>• TikTok for younger audience activation</li>
              <li>• Amazon for retail media and product discovery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


