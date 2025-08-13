"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { filterRecords, toChannelContribution, sampleData } from "@/lib/transform";
import { Filters } from "@/components/Filters";
import { WorldMap } from "@/components/WorldMap";
import { CircularFlag } from "@/components/CircularFlag";
import { getCountryCode } from "@/lib/countryFlags";
import { formatCurrency, formatNumber, formatPercentage, formatROI } from "@/lib/formatters";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart, Area } from "recharts";
import { ResponsiveTreeMap } from '@nivo/treemap';

export default function Overview() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'roi' | 'spend' | 'nr'>('roi');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();

  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  // Generate overview analytics
  const channelContribution = toChannelContribution(filtered);
  
  const performanceTimeline = useMemo(() => {
    const weeklyData = new Map<string, { week: string; totalSpend: number; totalNR: number; roi: number; reach: number }>();
    
    for (const r of filtered) {
      const weekKey = r.date.substring(0, 10); // Use date as week key for simplicity
      const prev = weeklyData.get(weekKey) ?? { week: weekKey, totalSpend: 0, totalNR: 0, roi: 0, reach: 0 };
      prev.totalSpend += r.spend;
      prev.totalNR += r.nr;
      prev.reach += r.reach;
      weeklyData.set(weekKey, prev);
    }
    
    const result = Array.from(weeklyData.values()).map(w => ({
      ...w,
      roi: w.totalSpend > 0 ? w.totalNR / w.totalSpend : 0
    })).sort((a, b) => a.week.localeCompare(b.week));
    
    return sampleData(result, 52); // Sample to 52 weeks for performance
  }, [filtered]);

  const brandPerformance = useMemo(() => {
    const brandMetrics = new Map<string, { brand: string; spend: number; nr: number; reach: number; impressions: number }>();
    
    for (const r of filtered) {
      const brand = r.brand || "Unknown";
      const prev = brandMetrics.get(brand) ?? { brand, spend: 0, nr: 0, reach: 0, impressions: 0 };
      prev.spend += r.spend;
      prev.nr += r.nr;
      prev.reach += r.reach;
      prev.impressions += r.impressions;
      brandMetrics.set(brand, prev);
    }
    
    return Array.from(brandMetrics.values()).map(b => ({
      brand: b.brand,
      spend: b.spend,
      nr: b.nr,
      roi: b.spend > 0 ? b.nr / b.spend : 0,
      reach: b.reach,
      marketShare: (b.nr / Array.from(brandMetrics.values()).reduce((sum, br) => sum + br.nr, 0)) * 100
    })).sort((a, b) => b.roi - a.roi);
  }, [filtered]);

  const marketPerformance = useMemo(() => {
    const marketMetrics = new Map<string, { market: string; spend: number; nr: number; efficiency: number; reach: number; impressions: number }>();
    
    for (const r of filtered) {
      const market = r.market || "Unknown";
      const prev = marketMetrics.get(market) ?? { market, spend: 0, nr: 0, efficiency: 0, reach: 0, impressions: 0 };
      prev.spend += r.spend;
      prev.nr += r.nr;
      prev.reach += r.reach;
      prev.impressions += r.impressions;
      marketMetrics.set(market, prev);
    }
    
    const results = Array.from(marketMetrics.values()).map(m => ({
      market: m.market,
      spend: m.spend,
      nr: m.nr,
      roi: m.spend > 0 ? m.nr / m.spend : 0,
      efficiency: (m.nr / 1000), // Simplified efficiency metric
      reach: m.reach,
      impressions: m.impressions,
      cpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0,
      conversionRate: m.impressions > 0 ? (m.nr / m.impressions) * 100 : 0
    }));

    // Apply sorting
    return results.sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * multiplier;
    });
  }, [filtered, sortBy, sortOrder]);

  // Create world map data
  const worldMapData = useMemo(() => {
    // Map market names to country codes/names for the world map
    const countryMapping: Record<string, { id: string; name: string }> = {
      'US': { id: 'USA', name: 'United States' },
      'UK': { id: 'GBR', name: 'United Kingdom' },
      'Germany': { id: 'DEU', name: 'Germany' },
      'France': { id: 'FRA', name: 'France' },
      'Japan': { id: 'JPN', name: 'Japan' },
      'Canada': { id: 'CAN', name: 'Canada' },
      'Australia': { id: 'AUS', name: 'Australia' },
      'Brazil': { id: 'BRA', name: 'Brazil' },
      'China': { id: 'CHN', name: 'China' },
      'India': { id: 'IND', name: 'India' },
      'Mexico': { id: 'MEX', name: 'Mexico' },
      'Italy': { id: 'ITA', name: 'Italy' },
      'Spain': { id: 'ESP', name: 'Spain' },
      'Netherlands': { id: 'NLD', name: 'Netherlands' },
      'Sweden': { id: 'SWE', name: 'Sweden' }
    };

    return marketPerformance.map(market => {
      const country = countryMapping[market.market] || { id: market.market, name: market.market };
      return {
        id: country.id,
        name: country.name,
        value: market.nr,
        roi: market.roi,
        spend: market.spend,
        nr: market.nr
      };
    });
  }, [marketPerformance]);



  const colors = ["#2d2d2d", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"];

  // Calculate executive summary metrics
  const totalSpend = filtered.reduce((sum, r) => sum + r.spend, 0);
  const totalNR = filtered.reduce((sum, r) => sum + r.nr, 0);
  const overallROI = totalSpend > 0 ? totalNR / totalSpend : 0;
  const avgReach = filtered.length > 0 ? filtered.reduce((sum, r) => sum + r.reach, 0) / filtered.length : 0;
  const topChannel = channelContribution.length > 0 ? channelContribution[0] : null;
  const topBrand = brandPerformance.length > 0 ? brandPerformance[0] : null;
  const bestMarket = marketPerformance.length > 0 ? marketPerformance[0] : null;
  const channelCount = channelContribution.length;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Executive Overview</h2>
        <p className="text-sm text-black/70">Birds-eye view of portfolio performance across brands, markets, and channels</p>
      </header>

      {/* Filters Section */}
      <section className="mb-6">
        <Filters />
      </section>

      {/* Executive Summary KPIs - Row 1 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Total Investment</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{formatCurrency(totalSpend, 1)}</p>
          <p className="text-xs text-black/60 mt-1">Media spend</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Net Revenue</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{formatCurrency(totalNR, 1)}</p>
          <p className="text-xs text-black/60 mt-1">Generated</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Portfolio ROI</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{formatROI(overallROI)}</p>
          <p className="text-xs text-black/60 mt-1">Blended average</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Avg Reach</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{formatNumber(avgReach, 1)}</p>
          <p className="text-xs text-black/60 mt-1">Cross-channel</p>
        </div>
      </div>

      {/* Executive Summary KPIs - Row 2 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Top Channel</h3>
          <p className="text-lg font-bold text-[#2d2d2d]">{topChannel?.channel || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">ROI: {formatROI(topChannel?.roi || 0)}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Top Brand</h3>
          <p className="text-lg font-bold text-[#2d2d2d]">{topBrand?.brand || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">ROI: {formatROI(topBrand?.roi || 0)}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Best Market</h3>
          <p className="text-lg font-bold text-[#2d2d2d]">{bestMarket?.market || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">ROI: {formatROI(bestMarket?.roi || 0)}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Active Channels</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{channelCount}</p>
          <p className="text-xs text-black/60 mt-1">In mix</p>
        </div>
      </div>

      {/* High-Level Performance Timeline */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Portfolio Performance Timeline</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={performanceTimeline}>
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
                typeof value === 'number' ? (name === 'roi' ? value.toFixed(2) : value.toLocaleString()) : value, 
                name === 'totalSpend' ? 'Total Spend' : name === 'totalNR' ? 'Total NR' : name === 'roi' ? 'ROI' : name === 'reach' ? 'Reach %' : name
              ]}
            />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="totalSpend" stroke="#8dd1e1" fill="#8dd1e1" fillOpacity={0.3} name="Total Spend" />
            <Area yAxisId="left" type="monotone" dataKey="totalNR" stroke="#2d2d2d" fill="#2d2d2d" fillOpacity={0.3} name="Total NR" />
            <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#ff7300" strokeWidth={3} name="ROI" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="reach" stroke="#82ca9d" strokeWidth={2} name="Reach %" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Channel Mix Overview & Brand Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[600px]">
        <div className="rounded-xl bg-white border border-black/10 p-4 flex flex-col h-full">
          <h3 className="font-medium mb-4">Channel Mix Overview</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveTreeMap
              data={{
                name: 'Channel Mix',
                children: channelContribution.map((channel, index) => ({
                  name: channel.channel,
                  value: channel.spend,
                  color: colors[index % colors.length]
                }))
              }}
              identity="name"
              value="value"
              valueFormat=".2s"
              innerPadding={2}
              outerPadding={2}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              labelSkipSize={12}
              labelTextColor="#ffffff"
              colors={(node) => node.data.color || '#8884d8'}
              borderColor={{ from: 'color', modifiers: [['darker', 0.6]] }}
              borderWidth={2}
              animate={true}
              motionStiffness={90}
              motionDamping={11}
              tooltip={({ node }) => (
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                  <div className="font-medium text-gray-900">{node.data.name}</div>
                  <div className="text-sm text-gray-600">
                    Spend: {formatCurrency(node.value)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {((node.value / channelContribution.reduce((sum, c) => sum + c.spend, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4 flex flex-col h-full">
          <h3 className="font-medium mb-4">Brand Performance Comparison</h3>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {brandPerformance.slice(0, 6).map((brand, idx) => {
              const maxROI = Math.max(...brandPerformance.slice(0, 6).map(b => b.roi));
              const roiPercentage = (brand.roi / maxROI) * 100;
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      ></div>
                      <span className="font-medium text-sm">{brand.brand}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatROI(brand.roi)}</div>
                        <div className="text-xs text-black/60">ROI</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatPercentage(brand.marketShare, 1)}</div>
                        <div className="text-xs text-black/60">Share</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ROI Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${roiPercentage}%`,
                        backgroundColor: colors[idx % colors.length]
                      }}
                    ></div>
                  </div>
                  
                  {/* Spend and NR metrics */}
                  <div className="flex justify-between text-xs text-black/60">
                    <span>Spend: {formatCurrency(brand.spend, 1)}</span>
                    <span>NR: {formatCurrency(brand.nr, 1)}</span>
                    <span>Reach: {formatNumber(brand.reach, 1)}</span>
                  </div>
                </div>
              );
            })}
            
            {/* Performance Insights */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-medium text-black/80 mb-2">Performance Insights</h4>
              <div className="text-xs text-black/60 space-y-1">
                <div>• ROI variance: {((Math.max(...brandPerformance.slice(0, 6).map(b => b.roi)) - Math.min(...brandPerformance.slice(0, 6).map(b => b.roi))) * 100).toFixed(1)}% range</div>
                <div>• Top performer leads by {((brandPerformance[0]?.roi || 0) - (brandPerformance[1]?.roi || 0)).toFixed(2)} ROI points</div>
                <div>• Portfolio shows consistent {brandPerformance.slice(0, 6).every(b => b.roi > 4) ? 'strong' : 'moderate'} performance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Market Performance */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Global Market Performance</h3>
          
          {/* Dynamic Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-black/70">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'roi' | 'spend' | 'nr')}
                className="text-xs border border-black/20 rounded px-2 py-1 bg-white"
              >
                <option value="roi">ROI</option>
                <option value="spend">Spend</option>
                <option value="nr">Net Revenue</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-black/70">Order:</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="text-xs border border-black/20 rounded px-2 py-1 bg-white"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dynamic Market Performance Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-black/80">Market Rankings</h4>
              {selectedCountry && (
                <button 
                  onClick={() => setSelectedCountry(null)}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Enhanced Market Cards */}
            <div className="space-y-2">
              {marketPerformance.map((market, idx) => {
                const isSelected = selectedCountry === market.market;
                return (
                  <div 
                    key={idx} 
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-black/10 hover:shadow-sm hover:border-black/20'
                    }`}
                    onClick={() => setSelectedCountry(selectedCountry === market.market ? null : market.market)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <CircularFlag 
                            countryCode={getCountryCode(market.market)} 
                            size="medium"
                          />
                          <span className="text-xs font-bold text-black/60 mt-1">#{idx + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{market.market}</div>
                          <div className="text-xs text-black/60">
                            CPM: {formatCurrency(market.cpm, 2)} | Conv: {formatPercentage(market.conversionRate, 2)}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-right">
                        <div>
                          <div className="text-sm font-bold">{formatROI(market.roi)}</div>
                          <div className="text-xs text-black/60">ROI</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{formatCurrency(market.spend, 1)}</div>
                          <div className="text-xs text-black/60">Spend</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{formatCurrency(market.nr, 1)}</div>
                          <div className="text-xs text-black/60">NR</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details for Selected Country */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-black/60 mb-1">Performance Metrics</div>
                            <div>Reach: {formatNumber(market.reach, 1)}</div>
                            <div>Impressions: {formatNumber(market.impressions, 0)}</div>
                            <div>Efficiency: {formatNumber(market.efficiency, 2)}</div>
                          </div>
                          <div>
                            <div className="text-black/60 mb-1">Calculated KPIs</div>
                            <div>Cost per Mille: {formatCurrency(market.cpm, 2)}</div>
                            <div>Conversion Rate: {formatPercentage(market.conversionRate, 2)}</div>
                            <div>Revenue per Impression: {formatCurrency(market.nr / market.impressions, 4)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive World Map */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-black/80">Geographical Performance</h4>
            
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-4 min-h-[400px]">
              <WorldMap 
                data={worldMapData}
                onCountryClick={(country) => setSelectedCountry(country.name)}
                selectedCountry={selectedCountry}
              />
            </div>

            {/* Enhanced Market Insights */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="text-xs font-medium text-black/80 mb-2">
                {selectedCountry ? `${selectedCountry} Insights` : 'Global Insights'}
              </h5>
              <div className="text-xs text-black/60 space-y-1">
                {selectedCountry ? (
                  // Selected country insights
                  (() => {
                    const selected = marketPerformance.find(m => m.market === selectedCountry);
                    if (!selected) return <div>No data available for selected country</div>;
                    
                    const rank = marketPerformance.findIndex(m => m.market === selectedCountry) + 1;
                    const totalMarkets = marketPerformance.length;
                    
                    return (
                      <>
                        <div>• Ranking: <strong>#{rank}</strong> out of {totalMarkets} markets</div>
                        <div>• ROI Performance: <strong>{formatROI(selected.roi)}</strong> ({selected.roi > 5 ? 'Above' : 'Below'} average)</div>
                        <div>• Investment Level: <strong>{formatCurrency(selected.spend, 1)}</strong> spend generating <strong>{formatCurrency(selected.nr, 1)}</strong> revenue</div>
                        <div>• Efficiency Metrics: <strong>{formatCurrency(selected.cpm, 2)}</strong> CPM with <strong>{formatPercentage(selected.conversionRate, 2)}</strong> conversion rate</div>
                      </>
                    );
                  })()
                ) : (
                  // Global insights
                  <>
                    <div>• Best performing region: <strong>{marketPerformance[0]?.market || "Market A"}</strong> ({formatROI(marketPerformance[0]?.roi || 5.8)} ROI)</div>
                    <div>• Total markets: <strong>{marketPerformance.length}</strong> active geographic regions</div>
                    <div>• Performance spread: <strong>{((Math.max(...marketPerformance.map(m => m.roi)) - Math.min(...marketPerformance.map(m => m.roi))) * 100).toFixed(0)}%</strong> variance</div>
                    <div>• Geographic optimization potential identified in underperforming regions</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Top Performing Channels</h3>
          <div className="space-y-3">
            {channelContribution.slice(0, 5).map((channel, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" 
                        style={{ backgroundColor: colors[idx % colors.length] }}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium">{channel.channel}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{channel.roi.toFixed(2)}</div>
                  <div className="text-xs text-black/60">${(channel.spend / 1000).toFixed(0)}K</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Top Performing Brands</h3>
          <div className="space-y-3">
            {brandPerformance.slice(0, 5).map((brand, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" 
                        style={{ backgroundColor: colors[idx % colors.length] }}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium">{brand.brand}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{brand.roi.toFixed(2)}</div>
                  <div className="text-xs text-black/60">{brand.marketShare.toFixed(1)}% share</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Top Performing Markets</h3>
          <div className="space-y-3">
            {marketPerformance.slice(0, 5).map((market, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <CircularFlag 
                      countryCode={getCountryCode(market.market)} 
                      size="small"
                    />
                    <span className="text-xs font-bold text-black/60 mt-1">#{idx + 1}</span>
                  </div>
                  <span className="text-sm font-medium">{market.market}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatROI(market.roi)}</div>
                  <div className="text-xs text-black/60">{formatCurrency(market.spend, 1)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Insights Summary */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Executive Strategic Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Performance Highlights</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Portfolio ROI: <strong>{formatROI(overallROI)}</strong> across {channelCount} channels</li>
              <li>• Top performer: <strong>{topChannel?.channel || "Meta"}</strong> ({formatROI(topChannel?.roi || 6.2)} ROI)</li>
              <li>• Total investment: <strong>{formatCurrency(totalSpend, 1)}</strong> generating <strong>{formatCurrency(totalNR, 1)}</strong> NR</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Brand Portfolio</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Leading brand: <strong>{topBrand?.brand || "Brand A"}</strong> ({formatPercentage(topBrand?.marketShare || 25, 1)} share)</li>
              <li>• Portfolio reach: <strong>{formatNumber(avgReach, 1)}</strong> average across channels</li>
              <li>• Brand diversification across {brandPerformance.length} active brands</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Market Performance</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Best market: <strong>{bestMarket?.market || "Market A"}</strong> ({formatROI(bestMarket?.roi || 5.8)} ROI)</li>
              <li>• Geographic presence across {marketPerformance.length} markets</li>
              <li>• Market optimization opportunities identified</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Strategic Priorities</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Geographic expansion: {marketPerformance.length} active markets with optimization potential</li>
              <li>• Channel diversification maintains risk balance across {channelCount} channels</li>
              <li>• Performance trends indicate scaling opportunities in top markets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
