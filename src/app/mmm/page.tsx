"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { 
  filterRecords, 
  toConsumerVsRetailPromo, 
  toMediaContributionDecomposition,
  toShortVsLongTermImpact,
  toSaturationCurveAnalysis,
  toMediaEfficiencyFrontier,
  toIncrementalImpactAnalysis,
  toChannelAttributionAnalysis,
  sampleData
} from "@/lib/transform";
import { formatCurrency, formatNumber, formatROI } from "@/lib/formatters";
import { 
  ComposedChart, 
  Line, 
  Bar, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie,
  BarChart
} from "recharts";

export default function MMMMetaPage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const [analysisType, setAnalysisType] = useState<'contribution' | 'attribution' | 'saturation'>('contribution');
  const [timeWindow, setTimeWindow] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  const { selectedBrand, selectedMarket, selectedChannels: globalChannels, startDate, endDate } = useDashboard();

  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    const baseFiltered = filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, globalChannels);
    
    // Apply local channel filter if any selected
    if (selectedChannels.length > 0) {
      return baseFiltered.filter(r => selectedChannels.includes(r.channel));
    }
    return baseFiltered;
  }, [data, selectedBrand, selectedMarket, startDate, endDate, globalChannels, selectedChannels]);

  // Generate analysis data
  const contributionData = useMemo(() => sampleData(toMediaContributionDecomposition(filtered), 52), [filtered]);
  const shortLongTermData = useMemo(() => toShortVsLongTermImpact(filtered), [filtered]);
  const saturationData = useMemo(() => toSaturationCurveAnalysis(filtered), [filtered]);
  const efficiencyData = useMemo(() => toMediaEfficiencyFrontier(filtered), [filtered]);
  const incrementalData = useMemo(() => sampleData(toIncrementalImpactAnalysis(filtered), 52), [filtered]);
  const attributionData = useMemo(() => toChannelAttributionAnalysis(filtered), [filtered]);
  const consumerRetailPromo = useMemo(() => toConsumerVsRetailPromo(filtered), [filtered]);

  const colors = ["#2d2d2d", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"];
  const uniqueChannels = [...new Set(filtered.map(r => r.channel))];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">MMM Meta Analyses</h2>
        <p className="text-sm text-black/70">Media mix modeling insights: contribution, attribution, saturation, and efficiency analysis</p>
      </header>

      {/* Analysis Controls */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Analysis Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-black/70 mb-2 block">Analysis Type</label>
            <select 
              value={analysisType} 
              onChange={(e) => setAnalysisType(e.target.value as 'contribution' | 'attribution' | 'saturation')}
              className="w-full text-sm border border-black/20 rounded-lg px-3 py-2 bg-white"
            >
              <option value="contribution">Media Contribution</option>
              <option value="attribution">Attribution Models</option>
              <option value="saturation">Saturation Analysis</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs font-medium text-black/70 mb-2 block">Time Aggregation</label>
            <select 
              value={timeWindow} 
              onChange={(e) => setTimeWindow(e.target.value as 'weekly' | 'monthly' | 'quarterly')}
              className="w-full text-sm border border-black/20 rounded-lg px-3 py-2 bg-white"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-black/70 mb-2 block">Channel Focus (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {uniqueChannels.slice(0, 6).map((channel) => (
                <button
                  key={channel}
                  onClick={() => {
                    setSelectedChannels(prev => 
                      prev.includes(channel) 
                        ? prev.filter(c => c !== channel)
                        : [...prev, channel]
                    );
                  }}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    selectedChannels.includes(channel)
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {channel}
                </button>
              ))}
              {selectedChannels.length > 0 && (
                <button
                  onClick={() => setSelectedChannels([])}
                  className="text-xs px-3 py-1 rounded-full bg-red-100 border-red-300 text-red-800"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">MMM Strategic Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Immediate Actions</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Rebalance spend toward long-term building channels (TV, BVOD)</li>
              <li>• Optimize high-saturation channels by reducing spend or improving creative</li>
              <li>• Increase investment in under-saturated, high-efficiency channels</li>
              <li>• Test attribution model impact on budget allocation decisions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Strategic Initiatives</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Develop integrated campaigns leveraging both short and long-term channels</li>
              <li>• Establish media contribution benchmarks for quarterly reviews</li>
              <li>• Implement dynamic budget allocation based on saturation curves</li>
              <li>• Create channel-specific KPIs aligned with contribution patterns</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Media Contribution Decomposition */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Media Contribution Decomposition</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={contributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value, name) => [formatCurrency(typeof value === 'number' ? value : 0, 1), name]}
            />
            <Legend />
            <Area type="monotone" dataKey="base" stackId="1" stroke="#8dd1e1" fill="#8dd1e1" fillOpacity={0.8} name="Base Revenue" />
            <Area type="monotone" dataKey="media" stackId="1" stroke="#2d2d2d" fill="#2d2d2d" fillOpacity={0.8} name="Media Driven" />
            <Area type="monotone" dataKey="promo" stackId="1" stroke="#ff7300" fill="#ff7300" fillOpacity={0.8} name="Promotional" />
            <Area type="monotone" dataKey="other" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.8} name="Other Factors" />
            <Line type="monotone" dataKey="total" stroke="#ffc658" strokeWidth={2} name="Total Revenue" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Short-term vs Long-term Impact & Consumer vs Retail vs Promo */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Short-term vs Long-term Impact</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shortLongTermData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="channel" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value, name) => [formatCurrency(typeof value === 'number' ? value : 0, 1), name]}
              />
              <Legend />
              <Bar dataKey="shortTerm" fill="#ff7300" name="Short-term Impact" />
              <Bar dataKey="longTerm" fill="#2d2d2d" name="Long-term Impact" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Consumer vs Retail vs Promo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={consumerRetailPromo}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="nr"
                label={({ cluster, nr }) => `${cluster}: ${formatCurrency(nr, 1)}`}
              >
                {consumerRetailPromo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value, name) => [formatCurrency(typeof value === 'number' ? value : 0, 1), 'Net Revenue']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Incremental Impact & Media Efficiency */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Incremental vs Baseline Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={incrementalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value, name) => [formatCurrency(typeof value === 'number' ? value : 0, 1), name]}
              />
              <Legend />
              <Area type="monotone" dataKey="baselineNR" stackId="1" stroke="#8dd1e1" fill="#8dd1e1" fillOpacity={0.6} name="Baseline Revenue" />
              <Area type="monotone" dataKey="incrementalNR" stackId="1" stroke="#2d2d2d" fill="#2d2d2d" fillOpacity={0.6} name="Incremental Revenue" />
              <Line type="monotone" dataKey="totalNR" stroke="#ff7300" strokeWidth={2} name="Total Revenue" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Media Efficiency Frontier</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="reach" tick={{ fontSize: 12 }} name="Reach" />
              <YAxis dataKey="roi" tick={{ fontSize: 12 }} name="ROI" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'roi' ? formatROI(value) : formatNumber(value, 1)) : value, 
                  name === 'reach' ? 'Reach' : name === 'roi' ? 'ROI' : name
                ]}
                labelFormatter={(label) => `Channel: ${label}`}
              />
              <Scatter dataKey="roi" fill="#2d2d2d">
                {efficiencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Portfolio Saturation Analysis */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Portfolio Saturation Analysis</h3>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Key Metrics Cards */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Current Spend</div>
            <div className="text-lg font-bold text-blue-800">
              {formatCurrency(filtered.reduce((sum, r) => sum + r.spend, 0), 1)}
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-xs text-green-600 font-medium">Current ROI</div>
            <div className="text-lg font-bold text-green-800">
              {formatROI(filtered.reduce((sum, r) => sum + r.nr, 0) / Math.max(filtered.reduce((sum, r) => sum + r.spend, 0), 1))}
            </div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-xs text-orange-600 font-medium">Saturation Level</div>
            <div className="text-lg font-bold text-orange-800">
              {saturationData.length > 1 ? `${saturationData[10]?.saturation.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-xs text-purple-600 font-medium">Optimal Spend</div>
            <div className="text-lg font-bold text-purple-800">
              {saturationData.length > 0 ? 
                formatCurrency(saturationData.find(d => d.marginalROI <= 1)?.spend || saturationData[Math.floor(saturationData.length * 0.7)]?.spend || 0, 1) : 
                'N/A'
              }
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={saturationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="spend" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => formatCurrency(value, 1)}
            />
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => `${value.toFixed(1)}`}
              label={{ value: 'ROI', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              label={{ value: 'Saturation %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value, name) => [
                typeof value === 'number' ? 
                  (name === 'roi' || name === 'marginalROI' ? formatROI(value) : 
                   name === 'saturation' ? `${value.toFixed(1)}%` : 
                   formatCurrency(value, 1)) : value,
                name === 'marginalROI' ? 'Marginal ROI' : 
                name === 'saturation' ? 'Saturation %' : 
                name === 'roi' ? 'Portfolio ROI' :
                name === 'nr' ? 'Net Revenue' : name
              ]}
              labelFormatter={(value) => `Spend: ${formatCurrency(typeof value === 'number' ? value : 0, 1)}`}
            />
            <Legend />
            
            {/* Main ROI curve */}
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="roi" 
              stroke="#2d2d2d" 
              strokeWidth={3} 
              name="Portfolio ROI" 
              dot={false}
            />
            
            {/* Saturation curve */}
            <Area 
              yAxisId="right" 
              type="monotone" 
              dataKey="saturation" 
              stroke="#ff7300" 
              fill="#ff7300" 
              fillOpacity={0.2}
              strokeWidth={2} 
              name="Saturation %" 
            />
            
            {/* Marginal ROI */}
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="marginalROI" 
              stroke="#82ca9d" 
              strokeWidth={2} 
              strokeDasharray="8 4" 
              name="Marginal ROI" 
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Analysis Insights */}
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-black/80 mb-2">Saturation Analysis Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-black/60">
            <div className="space-y-1">
              <div>• <strong>Current Position:</strong> Portfolio operating at {saturationData.length > 1 ? `${saturationData[10]?.saturation.toFixed(1)}%` : 'N/A'} saturation</div>
              <div>• <strong>Efficiency Status:</strong> {saturationData.length > 10 && saturationData[10]?.marginalROI > 1 ? 'Room for scaling' : 'Approaching optimal level'}</div>
              <div>• <strong>Investment Range:</strong> Optimal spend between {formatCurrency((saturationData[0]?.spend || 0) * 0.8, 1)} - {formatCurrency((saturationData[0]?.spend || 0) * 1.5, 1)}</div>
            </div>
            <div className="space-y-1">
              <div>• <strong>ROI Trajectory:</strong> {saturationData.length > 1 && saturationData[10]?.roi > saturationData[5]?.roi ? 'Declining with scale' : 'Stable performance'}</div>
              <div>• <strong>Marginal Returns:</strong> Each additional dollar generating {saturationData.length > 10 ? formatROI(saturationData[10]?.marginalROI || 0) : 'N/A'} ROI</div>
              <div>• <strong>Saturation Risk:</strong> {saturationData.length > 1 && saturationData[10]?.saturation > 70 ? 'High - consider diversification' : 'Moderate - safe to scale'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attribution Models Comparison */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Attribution Models Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={attributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="channel" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value, name) => [formatCurrency(typeof value === 'number' ? value : 0, 1), name]}
            />
            <Legend />
            <Bar dataKey="firstTouch" fill="#8dd1e1" name="First Touch" />
            <Bar dataKey="lastTouch" fill="#2d2d2d" name="Last Touch" />
            <Bar dataKey="linear" fill="#82ca9d" name="Linear" />
            <Bar dataKey="timeDecay" fill="#ffc658" name="Time Decay" />
            <Bar dataKey="positionBased" fill="#ff7300" name="Position Based" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Media Contribution Insights</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-black/70">Avg Media Contribution:</span>
              <span className="font-medium">
                {contributionData.length > 0 ? 
                  `${((contributionData.reduce((sum, d) => sum + d.media, 0) / contributionData.reduce((sum, d) => sum + d.total, 0)) * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/70">Avg Base Contribution:</span>
              <span className="font-medium">
                {contributionData.length > 0 ? 
                  `${((contributionData.reduce((sum, d) => sum + d.base, 0) / contributionData.reduce((sum, d) => sum + d.total, 0)) * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/70">Peak Media Week:</span>
              <span className="font-medium">
                {contributionData.length > 0 ? 
                  contributionData.reduce((max, d) => d.media > max.media ? d : max, contributionData[0])?.week.substring(5, 10) || 'N/A' : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Short vs Long-term Analysis</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-black/70">Most Short-term Channel:</span>
              <span className="font-medium">
                {shortLongTermData.length > 0 ? 
                  shortLongTermData.reduce((max, d) => (d.shortTerm / d.totalImpact) > (max.shortTerm / max.totalImpact) ? d : max)?.channel || 'N/A' : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/70">Most Long-term Channel:</span>
              <span className="font-medium">
                {shortLongTermData.length > 0 ? 
                  shortLongTermData.reduce((max, d) => (d.longTerm / d.totalImpact) > (max.longTerm / max.totalImpact) ? d : max)?.channel || 'N/A' : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/70">Portfolio Balance:</span>
              <span className="font-medium">
                {shortLongTermData.length > 0 ? 
                  `${((shortLongTermData.reduce((sum, d) => sum + d.shortTerm, 0) / shortLongTermData.reduce((sum, d) => sum + d.totalImpact, 0)) * 100).toFixed(0)}% Short` : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Efficiency & Saturation</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-black/70">Most Efficient Channel:</span>
              <span className="font-medium">
                {efficiencyData.length > 0 ? 
                  efficiencyData.reduce((max, d) => d.roi > max.roi ? d : max)?.channel || 'N/A' : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/70">Highest ROI:</span>
              <span className="font-medium">
                {efficiencyData.length > 0 ? 
                  formatROI(Math.max(...efficiencyData.map(d => d.roi))) : 
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/70">Saturation Risk:</span>
              <span className="font-medium text-amber-600">
                {saturationData.length > 0 ? 
                  (saturationData.some(d => d.saturation > 80) ? 'High' : saturationData.some(d => d.saturation > 60) ? 'Medium' : 'Low') : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
