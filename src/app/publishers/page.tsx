"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { 
  filterRecords,
  toPublisherPerformanceTimeseries,
  toPublisherROIvsScale,
  toCrossCountryPublisherAnalysis,
  toPublisherWinningTactics,
  toPublisherMarketShareGrowth,
  toCreativeFormatByPublisher,
  sampleData
} from "@/lib/transform";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, Cell, PieChart, Pie, ComposedChart, Area } from "recharts";

export default function PublishersPage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();
  
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);
  
  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  const publisherTimeseries = sampleData(toPublisherPerformanceTimeseries(filtered), 100);
  const publisherROIScale = toPublisherROIvsScale(filtered);
  const crossCountryAnalysis = toCrossCountryPublisherAnalysis(filtered);
  const winningTactics = toPublisherWinningTactics(filtered);
  const marketShareGrowth = toPublisherMarketShareGrowth(filtered);
  const creativeFormats = toCreativeFormatByPublisher(filtered);

  const colors = ["#2d2d2d", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"];
  const publisherColors: Record<string, string> = {
    "Meta": "#1877F2",
    "Google": "#4285F4", 
    "TikTok": "#000000",
    "Amazon": "#FF9900",
    "YouTube": "#FF0000",
    "DV360": "#34A853"
  };

  // Calculate insights
  const topPublisher = publisherROIScale.length > 0 ? publisherROIScale[0] : null;
  const fastestGrowing = marketShareGrowth.filter(p => p.trend === "Growing").sort((a, b) => b.growth - a.growth)[0];
  const totalMarketSpend = publisherROIScale.reduce((sum, p) => sum + p.totalSpend, 0);
  const avgMarketROI = publisherROIScale.length > 0 ? 
    publisherROIScale.reduce((sum, p) => sum + p.avgROI, 0) / publisherROIScale.length : 0;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Publishers</h2>
        <p className="text-sm text-black/70">Cross-country learnings, winning tactics, and performance benchmarks by key publisher</p>
      </header>

      {/* Key Publisher Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Top Publisher</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{topPublisher?.publisher || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">ROI: {topPublisher?.avgROI.toFixed(2) || "0.00"}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Fastest Growing</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{fastestGrowing?.publisher || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">+{fastestGrowing?.growth.toFixed(1) || "0.0"}% growth</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Market Spend</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">${(totalMarketSpend / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-black/60 mt-1">Total across publishers</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Avg Market ROI</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{avgMarketROI.toFixed(2)}</p>
          <p className="text-xs text-black/60 mt-1">Weighted average</p>
        </div>
      </div>

      {/* Publisher Performance Timeline */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Publisher Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={publisherTimeseries}>
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
            <Area yAxisId="left" type="monotone" dataKey="metaSpend" stackId="1" stroke={publisherColors.Meta} fill={publisherColors.Meta} fillOpacity={0.3} name="Meta Spend" />
            <Area yAxisId="left" type="monotone" dataKey="googleSpend" stackId="1" stroke={publisherColors.Google} fill={publisherColors.Google} fillOpacity={0.3} name="Google Spend" />
            <Area yAxisId="left" type="monotone" dataKey="tiktokSpend" stackId="1" stroke={publisherColors.TikTok} fill={publisherColors.TikTok} fillOpacity={0.3} name="TikTok Spend" />
            <Area yAxisId="left" type="monotone" dataKey="amazonSpend" stackId="1" stroke={publisherColors.Amazon} fill={publisherColors.Amazon} fillOpacity={0.3} name="Amazon Spend" />
            <Line yAxisId="right" type="monotone" dataKey="metaNr" stroke={publisherColors.Meta} strokeWidth={2} name="Meta NR" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="googleNr" stroke={publisherColors.Google} strokeWidth={2} name="Google NR" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Publisher ROI vs Scale & Market Share Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Publisher ROI vs Scale Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={publisherROIScale}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="totalSpend" name="Total Spend" tick={{ fontSize: 12 }} />
              <YAxis dataKey="avgROI" name="Average ROI" tick={{ fontSize: 12 }} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'totalSpend' ? '$' + value.toLocaleString() : name === 'marketShare' ? value.toFixed(1) + '%' : value.toFixed(2)) : value, 
                  name === 'totalSpend' ? 'Total Spend' : name === 'avgROI' ? 'Average ROI' : name === 'marketShare' ? 'Market Share' : name === 'reach' ? 'Reach %' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.publisher;
                  }
                  return '';
                }}
              />
              {Object.keys(publisherColors).map(publisher => (
                <Scatter 
                  key={publisher}
                  data={publisherROIScale.filter(d => d.publisher === publisher)} 
                  fill={publisherColors[publisher]} 
                  name={publisher}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Publisher Market Share Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marketShareGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="publisher" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'growth' ? (value > 0 ? '+' : '') + value.toFixed(1) + '%' : value.toFixed(1) + '%') : value, 
                  name === 'currentShare' ? 'Current Share' : name === 'previousShare' ? 'Previous Share' : name === 'growth' ? 'Growth' : name
                ]}
              />
              <Bar dataKey="currentShare" name="Current Share">
                {marketShareGrowth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={publisherColors[entry.publisher] || colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cross-Country Analysis & Creative Format Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Cross-Country Publisher Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-2 px-3 font-medium">Publisher</th>
                  <th className="text-left py-2 px-3 font-medium">Market</th>
                  <th className="text-right py-2 px-3 font-medium">ROI</th>
                  <th className="text-right py-2 px-3 font-medium">CPM</th>
                  <th className="text-center py-2 px-3 font-medium">Local Rank</th>
                </tr>
              </thead>
              <tbody>
                {crossCountryAnalysis.slice(0, 8).map((row, idx) => (
                  <tr key={idx} className="border-b border-black/5 hover:bg-black/5">
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 rounded text-xs" style={{ 
                        backgroundColor: publisherColors[row.publisher] + '20', 
                        color: publisherColors[row.publisher] || '#000' 
                      }}>
                        {row.publisher}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs">{row.market}</td>
                    <td className="py-2 px-3 text-right font-bold">{row.roi.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">${row.cpm.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        row.localRank === 1 ? "bg-green-100 text-green-800" :
                        row.localRank === 2 ? "bg-blue-100 text-blue-800" :
                        row.localRank === 3 ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        #{row.localRank}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Creative Format Performance by Publisher</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={creativeFormats.slice(0, 10)}>
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
                  typeof value === 'number' ? (name === 'shareOfPublisher' ? value.toFixed(1) + '%' : value.toFixed(2)) : value, 
                  name === 'roi' ? 'ROI' : name === 'shareOfPublisher' ? 'Share of Publisher' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `${payload[0].payload.publisher} - ${label}`;
                  }
                  return label;
                }}
              />
              <Bar dataKey="roi" name="ROI">
                {creativeFormats.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={publisherColors[entry.publisher] || colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Publisher Winning Tactics Table */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Publisher Winning Tactics & Key Learnings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 px-3 font-medium">Publisher</th>
                <th className="text-left py-2 px-3 font-medium">Best Format</th>
                <th className="text-left py-2 px-3 font-medium">Best Targeting</th>
                <th className="text-left py-2 px-3 font-medium">Best Buying Type</th>
                <th className="text-right py-2 px-3 font-medium">Avg ROI</th>
                <th className="text-right py-2 px-3 font-medium">Success Rate</th>
                <th className="text-left py-2 px-3 font-medium">Key Learning</th>
              </tr>
            </thead>
            <tbody>
              {winningTactics.map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 hover:bg-black/5">
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded text-xs font-medium" style={{ 
                      backgroundColor: publisherColors[row.publisher] + '20', 
                      color: publisherColors[row.publisher] || '#000' 
                    }}>
                      {row.publisher}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs">{row.bestFormat}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">{row.bestTargeting}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">{row.bestBuyingType}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold">{row.avgROI.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.successRate > 0.8 ? "bg-green-100 text-green-800" :
                      row.successRate > 0.7 ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {(row.successRate * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs max-w-xs">{row.keyLearning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Publisher Market Share Pie Chart & Growth Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Current Market Share Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={marketShareGrowth}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="currentShare"
                label={({ publisher, currentShare }) => `${publisher}: ${currentShare.toFixed(1)}%`}
              >
                {marketShareGrowth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={publisherColors[entry.publisher] || colors[index % colors.length]} />
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
                  'Market Share'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Growth Trend Analysis</h3>
          <div className="space-y-4">
            {marketShareGrowth.map((publisher, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-black/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: publisherColors[publisher.publisher] || colors[idx % colors.length] }}
                  ></div>
                  <span className="font-medium text-sm">{publisher.publisher}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">{publisher.currentShare.toFixed(1)}%</div>
                    <div className="text-xs text-black/60">Current Share</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      publisher.growth > 0 ? 'text-green-600' : 
                      publisher.growth < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {publisher.growth > 0 ? '+' : ''}{publisher.growth.toFixed(1)}%
                    </div>
                    <div className="text-xs text-black/60">Growth</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    publisher.trend === "Growing" ? "bg-green-100 text-green-800" :
                    publisher.trend === "Declining" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {publisher.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Publisher Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Publisher Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Performance Leaders</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Top ROI: <strong>{topPublisher?.publisher || "Meta"}</strong> ({topPublisher?.avgROI.toFixed(2) || "5.2"} ROI)</li>
              <li>• Scale leader: Highest reach with efficient CPMs</li>
              <li>• Focus on winning formats and targeting tactics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Growth Opportunities</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Fastest growing: <strong>{fastestGrowing?.publisher || "TikTok"}</strong> (+{fastestGrowing?.growth.toFixed(1) || "12.5"}%)</li>
              <li>• Emerging platforms showing strong momentum</li>
              <li>• Test budget reallocation to growth channels</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Platform Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Meta: Video + broad targeting for engagement</li>
              <li>• Google: Search intent + responsive ads</li>
              <li>• TikTok: Short video + younger audiences</li>
              <li>• Amazon: Product focus + purchase intent</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
