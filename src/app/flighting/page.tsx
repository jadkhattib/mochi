"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { 
  filterRecords,
  toFlightingScenarioAnalysis,
  toFlightPatternTimeseries,
  toBudgetScenarioOptimization,
  toSaturationCurveAnalysis,
  toFlightTimingRecommendations,
  toCompetitiveFlightAnalysis,
  sampleData
} from "@/lib/transform";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Area } from "recharts";

export default function FlightingPage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>("All");
  const [optimizationGoal, setOptimizationGoal] = useState<"ROI" | "Sales">("ROI");
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();
  
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);
  
  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  const flightingScenarios = toFlightingScenarioAnalysis(filtered);
  const flightPatternTimeseries = sampleData(toFlightPatternTimeseries(filtered), 52);
  const budgetScenarios = toBudgetScenarioOptimization(filtered);
  const saturationCurves = toSaturationCurveAnalysis(filtered);
  const timingRecommendations = toFlightTimingRecommendations(filtered);
  const competitiveAnalysis = toCompetitiveFlightAnalysis(filtered);

  const colors = ["#2d2d2d", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"];
  const flightColors = {
    "Always On": "#2d2d2d",
    "1 Week On / 1 Week Off": "#8884d8",
    "2 Weeks On / 2 Weeks Off": "#82ca9d",
    "4 Weeks On / 4 Weeks Off": "#ffc658",
    "Front-loaded": "#ff7300",
    "Back-loaded": "#8dd1e1"
  };

  // Calculate insights
  const bestScenario = flightingScenarios.length > 0 ? flightingScenarios[0] : null;
  const bestBudgetScenario = budgetScenarios.length > 0 ? budgetScenarios[0] : null;
  const optimalSpendLevel = saturationCurves.find(s => !s.diminishingReturns && s.saturationPoint > 80)?.spendLevel || 2.0;
  const avgEfficiency = flightingScenarios.reduce((sum, s) => sum + (s.efficiency === "Very High" ? 5 : s.efficiency === "High" ? 4 : s.efficiency === "Medium" ? 3 : 2), 0) / flightingScenarios.length;

  // Filter data based on selected scenario
  const filteredTimeseries = selectedScenario === "All" ? flightPatternTimeseries : 
    flightPatternTimeseries.map(d => ({
      ...d,
      ...(selectedScenario === "Always On" ? { alternatingSpend: 0, burstSpend: 0, alternatingNR: 0, burstNR: 0 } :
          selectedScenario === "Alternating" ? { alwaysOnSpend: 0, burstSpend: 0, alwaysOnNR: 0, burstNR: 0 } :
          { alwaysOnSpend: 0, alternatingSpend: 0, alwaysOnNR: 0, alternatingNR: 0 })
    }));

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Flighting Scenarios</h2>
        <p className="text-sm text-black/70">Optimal flighting patterns for ROI and sales optimization with budget scenario modeling</p>
      </header>

      {/* Flighting Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-3">Flight Pattern Filter</h3>
          <select 
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="All">All Patterns</option>
            <option value="Always On">Always On</option>
            <option value="Alternating">1 Week On/Off</option>
            <option value="Burst">2 Weeks On/Off</option>
          </select>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-3">Optimization Goal</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setOptimizationGoal("ROI")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                optimizationGoal === "ROI" ? "bg-[#2d2d2d] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Maximize ROI
            </button>
            <button 
              onClick={() => setOptimizationGoal("Sales")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                optimizationGoal === "Sales" ? "bg-[#2d2d2d] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Maximize Sales
            </button>
          </div>
        </div>
      </div>

      {/* Key Flighting Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Best Scenario</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{bestScenario?.scenario || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">ROI: {bestScenario?.roi.toFixed(2) || "0.00"}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Optimal Budget</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{bestBudgetScenario?.budgetLevel || "Current"}</p>
          <p className="text-xs text-black/60 mt-1">Efficiency: {bestBudgetScenario?.efficiency.toFixed(1) || "100"}%</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Spend Level</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{optimalSpendLevel}x</p>
          <p className="text-xs text-black/60 mt-1">Before saturation</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Avg Efficiency</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{avgEfficiency.toFixed(1)}/5</p>
          <p className="text-xs text-black/60 mt-1">Pattern performance</p>
        </div>
      </div>

      {/* Flight Pattern Performance Timeline */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Flight Pattern Performance Over Time ({selectedScenario})</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={filteredTimeseries}>
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
                typeof value === 'number' ? value.toLocaleString() : value, 
                typeof name === 'string' && name.includes('Spend') ? name.replace('Spend', ' Spend') : 
                typeof name === 'string' && name.includes('NR') ? name.replace('NR', ' NR') : name
              ]}
            />
            <Legend />
            {selectedScenario === "All" || selectedScenario === "Always On" ? (
              <>
                <Area yAxisId="left" type="monotone" dataKey="alwaysOnSpend" stackId="1" stroke="#2d2d2d" fill="#2d2d2d" fillOpacity={0.3} name="Always On Spend" />
                <Line yAxisId="right" type="monotone" dataKey="alwaysOnNR" stroke="#2d2d2d" strokeWidth={2} name="Always On NR" dot={false} />
              </>
            ) : null}
            {selectedScenario === "All" || selectedScenario === "Alternating" ? (
              <>
                <Area yAxisId="left" type="monotone" dataKey="alternatingSpend" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Alternating Spend" />
                <Line yAxisId="right" type="monotone" dataKey="alternatingNR" stroke="#8884d8" strokeWidth={2} name="Alternating NR" dot={false} />
              </>
            ) : null}
            {selectedScenario === "All" || selectedScenario === "Burst" ? (
              <>
                <Area yAxisId="left" type="monotone" dataKey="burstSpend" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Burst Spend" />
                <Line yAxisId="right" type="monotone" dataKey="burstNR" stroke="#82ca9d" strokeWidth={2} name="Burst NR" dot={false} />
              </>
            ) : null}
            <Line yAxisId="right" type="monotone" dataKey="saturationIndex" stroke="#ff7300" strokeWidth={1} strokeDasharray="5 5" name="Saturation Index" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Flighting Scenario Analysis & Budget Optimization */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Flighting Scenario ROI Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flightingScenarios}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="scenario" tick={{ fontSize: 12 }} />
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
                  name === 'roi' ? 'ROI' : name === 'avgWeeklySpend' ? 'Avg Weekly Spend' : name === 'weeksActive' ? 'Weeks Active' : name
                ]}
              />
              <Bar dataKey="roi" name="ROI">
                {flightingScenarios.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={flightColors[entry.scenario as keyof typeof flightColors] || colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Budget Scenario Optimization ({optimizationGoal})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetScenarios}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="budgetLevel" tick={{ fontSize: 12 }} />
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
                  optimizationGoal === "ROI" ? (name === 'roiOptimalROI' ? 'ROI' : name === 'roiOptimalNR' ? 'Net Revenue' : name) :
                  (name === 'salesOptimalROI' ? 'ROI' : name === 'salesOptimalNR' ? 'Net Revenue' : name)
                ]}
              />
              <Bar dataKey={optimizationGoal === "ROI" ? "roiOptimalROI" : "salesOptimalROI"} name={optimizationGoal === "ROI" ? "ROI" : "Sales ROI"}>
                {budgetScenarios.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.budgetLevel === "Current Budget" ? "#ff7300" : colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Saturation Curve Analysis & Competitive Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Saturation Curve Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={saturationCurves}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="spendLevel" tick={{ fontSize: 12 }} />
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
                  name === 'continuousROI' ? 'Continuous ROI' : name === 'alternatingROI' ? 'Alternating ROI' : name === 'burstROI' ? 'Burst ROI' : name
                ]}
              />
              <Legend />
              <Line type="monotone" dataKey="continuousROI" stroke="#2d2d2d" strokeWidth={2} name="Continuous" />
              <Line type="monotone" dataKey="alternatingROI" stroke="#8884d8" strokeWidth={2} name="Alternating" />
              <Line type="monotone" dataKey="burstROI" stroke="#82ca9d" strokeWidth={2} name="Burst" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Competitive Flight Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={competitiveAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
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
                  typeof value === 'number' ? (typeof name === 'string' && name.includes('Share') ? value.toFixed(1) + '%' : value.toLocaleString()) : value, 
                  name === 'marketShare' ? 'Market Share' : name === 'shareOfVoice' ? 'Share of Voice' : name === 'efficiency' ? 'Efficiency' : name
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="marketShare" fill="#82ca9d" name="Market Share %" />
              <Bar yAxisId="left" dataKey="shareOfVoice" fill="#8884d8" name="Share of Voice %" />
              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#ff7300" strokeWidth={2} name="Efficiency" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flighting Scenario Details Table */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Flighting Scenario Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 px-3 font-medium">Scenario</th>
                <th className="text-left py-2 px-3 font-medium">Pattern</th>
                <th className="text-right py-2 px-3 font-medium">ROI</th>
                <th className="text-right py-2 px-3 font-medium">Total Spend</th>
                <th className="text-right py-2 px-3 font-medium">Weeks Active</th>
                <th className="text-right py-2 px-3 font-medium">Avg Weekly</th>
                <th className="text-center py-2 px-3 font-medium">Efficiency</th>
                <th className="text-left py-2 px-3 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {flightingScenarios.map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 hover:bg-black/5">
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded text-xs font-medium" style={{ 
                      backgroundColor: (flightColors[row.scenario as keyof typeof flightColors] || colors[idx % colors.length]) + '20', 
                      color: flightColors[row.scenario as keyof typeof flightColors] || colors[idx % colors.length]
                    }}>
                      {row.scenario}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs">{row.pattern}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold">{row.roi.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">${row.totalSpend.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">{row.weeksActive}</td>
                  <td className="py-2 px-3 text-right">${row.avgWeeklySpend.toLocaleString()}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.efficiency === "Very High" ? "bg-green-100 text-green-800" :
                      row.efficiency === "High" ? "bg-blue-100 text-blue-800" :
                      row.efficiency === "Medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {row.efficiency}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs max-w-xs">{row.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flight Timing Recommendations */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Strategic Flight Timing Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {timingRecommendations.map((timing, idx) => (
            <div key={idx} className="border border-black/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">{timing.timing}</h4>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  timing.confidence === "High" ? "bg-green-100 text-green-800" :
                  timing.confidence === "Medium" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {timing.confidence}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium">Scenario:</span> {timing.scenario}
                </div>
                <div>
                  <span className="font-medium">Expected Lift:</span> +{timing.expectedLift}%
                </div>
                <div>
                  <span className="font-medium">Best Channels:</span> {timing.bestChannels}
                </div>
                <div>
                  <span className="font-medium">Reasoning:</span> {timing.reasoning}
                </div>
                <div>
                  <span className="font-medium">Implementation:</span> {timing.implementation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Flighting Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Flighting Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">High-Performance Patterns</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Best ROI: <strong>{bestScenario?.scenario || "1 Week On/Off"}</strong> ({bestScenario?.roi.toFixed(2) || "6.2"} ROI)</li>
              <li>• Most efficient: Alternating patterns reduce saturation</li>
              <li>• Concentrated spend increases impact per dollar</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Budget Optimization</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Optimal budget: <strong>{bestBudgetScenario?.budgetLevel || "Current"}</strong></li>
              <li>• Saturation point: {optimalSpendLevel}x current spend level</li>
              <li>• Focus on {optimizationGoal === "ROI" ? "efficiency" : "volume"} optimization</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Timing Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Q1 launch: Front-loaded burst for maximum impact</li>
              <li>• Seasonal: Build anticipation with pre-season bursts</li>
              <li>• Competitive gaps: Exploit quiet periods efficiently</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
