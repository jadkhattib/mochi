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
          <h3 className="font-medium mb-4">Channel Synergy Matrix - Best Combinations</h3>
          
          {/* Top Synergy Pairs - Visual Cards */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-black/80 mb-3">Strongest Synergy Pairs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {synergyMatrix.slice(0, 4).map((synergy, idx) => {
                const liftColor = synergy.liftPercent > 25 ? "from-green-500 to-emerald-600" :
                                 synergy.liftPercent > 15 ? "from-blue-500 to-indigo-600" :
                                 "from-gray-500 to-slate-600";
                const textColor = synergy.liftPercent > 25 ? "text-green-700" :
                                 synergy.liftPercent > 15 ? "text-blue-700" :
                                 "text-gray-700";
                
                return (
                  <div key={idx} className="relative p-3 border border-black/10 rounded-lg bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1 bg-black/10 rounded text-xs font-medium">{synergy.channel1}</span>
                          <span className="text-lg">+</span>
                          <span className="px-2 py-1 bg-black/10 rounded text-xs font-medium">{synergy.channel2}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${textColor}`}>+{synergy.liftPercent.toFixed(1)}%</div>
                        <div className="text-xs text-black/60">Lift</div>
                      </div>
                    </div>
                    
                    {/* Visual strength indicator */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${liftColor}`}
                        style={{ width: `${Math.min(synergy.liftPercent * 2, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-1 text-xs text-black/60">
                      Synergy Score: {synergy.synergyScore.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Key Insights */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h4 className="text-xs font-medium text-blue-800 mb-2">Synergy Insights</h4>
            <div className="text-xs text-blue-600 space-y-1">
              <div>• <strong>Best Pair:</strong> {synergyMatrix[0]?.channel1 || 'TV'} + {synergyMatrix[0]?.channel2 || 'Digital'} delivers +{synergyMatrix[0]?.liftPercent.toFixed(0) || '28'}% lift</div>
              <div>• <strong>High Synergy Count:</strong> {synergyMatrix.filter(s => s.liftPercent > 15).length} pairs exceed 15% lift threshold</div>
              <div>• <strong>TV-Digital:</strong> Strongest cross-channel synergy for reach amplification</div>
              <div>• <strong>Strategy:</strong> Activate top 3 pairs simultaneously for maximum portfolio impact</div>
            </div>
          </div>
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

      {/* All Channel Combinations - Horizontal Section */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">All Channel Combinations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {synergyMatrix.slice(0, 16).map((synergy, idx) => {
            const intensity = synergy.liftPercent;
            const bgColor = intensity > 25 ? "bg-green-100 border-green-300" :
                           intensity > 15 ? "bg-blue-100 border-blue-300" :
                           intensity > 8 ? "bg-yellow-100 border-yellow-300" :
                           "bg-gray-100 border-gray-300";
            const textColor = intensity > 25 ? "text-green-800" :
                             intensity > 15 ? "text-blue-800" :
                             intensity > 8 ? "text-yellow-800" :
                             "text-gray-700";
            
            return (
              <div key={idx} className={`p-3 border rounded-lg ${bgColor} hover:shadow-md transition-shadow cursor-pointer`}>
                <div className="text-center">
                  <div className="text-xs font-medium text-black/80 mb-1">
                    {synergy.channel1.slice(0, 4)} + {synergy.channel2.slice(0, 4)}
                  </div>
                  <div className={`text-sm font-bold ${textColor}`}>
                    +{synergy.liftPercent.toFixed(0)}%
                  </div>
                  <div className="text-xs text-black/60 mt-1">
                    {synergy.synergyScore.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Network Strength - Horizontal Section */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Channel Network Strength</h3>
        
        {/* Network Visualization with Fixed Layout */}
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-orange-50 rounded-lg opacity-60"></div>
          
          {/* Fixed layout container with precise positioning */}
          <div className="relative mx-auto" style={{ width: '700px', height: '320px' }}>
            
            {/* Channel nodes with fixed positions */}
            <div className="absolute inset-0">
              
              {/* Linear TV - Fixed position */}
              <div className="absolute group cursor-pointer" style={{ top: '48px', left: '64px' }}>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center text-white font-bold shadow-xl border-2 border-white transform transition-transform group-hover:scale-110">
                    <span className="text-sm">TV</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  <div className="mt-2 text-xs text-center font-medium text-gray-700">Linear TV</div>
                </div>
              </div>
              
              {/* CTV - Fixed center position */}
              <div className="absolute group cursor-pointer" style={{ top: '32px', left: '342px' }}>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-xl border-2 border-white transform transition-transform group-hover:scale-110">
                    <span className="text-sm">CTV</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white"></div>
                  <div className="mt-2 text-xs text-center font-medium text-gray-700">Connected TV</div>
                </div>
              </div>
              
              {/* Meta - Fixed position */}
              <div className="absolute group cursor-pointer" style={{ top: '48px', left: '572px' }}>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold shadow-xl border-2 border-white transform transition-transform group-hover:scale-110">
                    <span className="text-xs">META</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full border-2 border-white"></div>
                  <div className="mt-2 text-xs text-center font-medium text-gray-700">Meta Ads</div>
                </div>
              </div>
              
              {/* Google - Fixed position */}
              <div className="absolute group cursor-pointer" style={{ top: '138px', left: '32px' }}>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-bold shadow-xl border-2 border-white transform transition-transform group-hover:scale-110">
                    <span className="text-sm">GOOG</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white"></div>
                  <div className="mt-2 text-xs text-center font-medium text-gray-700">Google Ads</div>
                </div>
              </div>
              
              {/* TikTok - Fixed position */}
              <div className="absolute group cursor-pointer" style={{ top: '138px', left: '604px' }}>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-xl border-2 border-white transform transition-transform group-hover:scale-110">
                    <span className="text-xs">TIKTOK</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-400 rounded-full border-2 border-white"></div>
                  <div className="mt-2 text-xs text-center font-medium text-gray-700">TikTok Ads</div>
                </div>
              </div>
              
              {/* Amazon - Fixed position */}
              <div className="absolute group cursor-pointer" style={{ top: '208px', left: '156px' }}>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center text-white font-bold shadow-xl border-2 border-white transform transition-transform group-hover:scale-110">
                    <span className="text-xs">AMZN</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full border-2 border-white"></div>
                  <div className="mt-2 text-xs text-center font-medium text-gray-700">Amazon</div>
                </div>
              </div>
              
              {/* Promo - Fixed position */}
              <div className="absolute group cursor-pointer" style={{ top: '208px', left: '476px' }}>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white font-bold shadow-xl border-2 border-white transform transition-transform group-hover:scale-110">
                    <span className="text-xs">PROMO</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 rounded-full border-2 border-white"></div>
                  <div className="mt-2 text-xs text-center font-medium text-gray-700">Promotions</div>
                </div>
              </div>
              
              {/* SVG with exact coordinates matching fixed positions */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.1))' }}>
                <defs>
                  <linearGradient id="strongGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#374151" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#6B7280" stopOpacity="0.4"/>
                  </linearGradient>
                  <linearGradient id="mediumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.3"/>
                  </linearGradient>
                  <linearGradient id="moderateGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
                
                {/* TV center (96,80) to CTV center (374,64) - Strong synergy */}
                <line x1="96" y1="80" x2="374" y2="64" stroke="url(#strongGradient)" strokeWidth="6" strokeLinecap="round">
                  <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="3s" repeatCount="indefinite"/>
                </line>
                
                {/* Google center (72,178) to CTV center (374,64) - Strong synergy */}
                <line x1="72" y1="178" x2="374" y2="64" stroke="url(#strongGradient)" strokeWidth="5" strokeLinecap="round">
                  <animate attributeName="stroke-dasharray" values="0,15;15,0" dur="4s" repeatCount="indefinite"/>
                </line>
                
                {/* CTV center (374,64) to Meta center (604,80) - Good synergy */}
                <line x1="374" y1="64" x2="604" y2="80" stroke="url(#mediumGradient)" strokeWidth="4" strokeLinecap="round" strokeDasharray="8,4">
                  <animate attributeName="stroke-dashoffset" values="0;12" dur="2s" repeatCount="indefinite"/>
                </line>
                
                {/* Google center (72,178) to TikTok center (636,170) - Good synergy */}
                <line x1="72" y1="178" x2="636" y2="170" stroke="url(#mediumGradient)" strokeWidth="4" strokeLinecap="round" strokeDasharray="8,4">
                  <animate attributeName="stroke-dashoffset" values="0;12" dur="2.5s" repeatCount="indefinite"/>
                </line>
                
                {/* TV center (96,80) to Amazon center (188,240) - Moderate synergy */}
                <line x1="96" y1="80" x2="188" y2="240" stroke="url(#moderateGradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4,8" opacity="0.7"/>
                
                {/* Meta center (604,80) to Promo center (508,240) - Moderate synergy */}
                <line x1="604" y1="80" x2="508" y2="240" stroke="url(#moderateGradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4,8" opacity="0.7"/>
                
                {/* Amazon center (188,240) to Promo center (508,240) - Moderate synergy */}
                <line x1="188" y1="240" x2="508" y2="240" stroke="url(#moderateGradient)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6,6" opacity="0.6"/>
                
                {/* TikTok center (636,170) to Meta center (604,80) - Cross synergy */}
                <line x1="636" y1="170" x2="604" y2="80" stroke="url(#moderateGradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="5,5" opacity="0.5"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Enhanced Legend with Performance Metrics */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-2 bg-gradient-to-r from-gray-700 to-gray-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-800">Strong Synergy</div>
                <div className="text-xs text-gray-600">25%+ lift when activated together</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-800">Good Synergy</div>
                <div className="text-xs text-gray-600">15-25% performance boost</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-2 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-800">Moderate Synergy</div>
                <div className="text-xs text-gray-600">8-15% incremental value</div>
              </div>
            </div>
          </div>
          
          {/* Key Insights */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <div>• <strong>TV + Google:</strong> Strongest cross-channel synergy for reach amplification</div>
              <div>• <strong>Meta + TikTok:</strong> Social ecosystem synergy drives engagement</div>
              <div>• <strong>CTV Hub:</strong> Central connector enabling digital-TV convergence</div>
            </div>
          </div>
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
              <li>• Activate high-synergy pairs (+{strongestSynergy?.liftPercent.toFixed(0) || "25"}% lift) simultaneously</li>
              <li>• Coordinate {highSynergyPairs} channel pairs with &gt;15% synergy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Brand Portfolio</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Strong halo effects within category clusters</li>
              <li>• {strongestHalo ? `${strongestHalo.sourceBrand} drives ${strongestHalo.targetBrand}` : "Cross-brand activation opportunities"}</li>
              <li>• Coordinate portfolio campaigns for maximum halo</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Timing Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• TV + Digital: Launch simultaneously for +25% lift</li>
              <li>• Seasonal: TV 1 week before digital (+18% lift)</li>
              <li>• Product launches: Digital 3 days after TV (+22% lift)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
