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
  const optimalSpendLevel = saturationCurves.find(s => s.saturation > 80)?.spend || 2.0;
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

      {/* Strategic Flighting Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Flighting Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Optimal Patterns</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Best pattern: <strong>{flightScenarioROI.reduce((max, f) => f.roi > max.roi ? f : max, flightScenarioROI[0])?.scenario || "Pulsing"}</strong></li>
              <li>• Current saturation: {saturationData.length > 10 ? `${saturationData[10]?.saturation?.toFixed(1)}%` : "N/A"}</li>
              <li>• Optimize spend timing for maximum efficiency</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Budget Optimization</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Focus on {budgetScenarios.reduce((max, b) => b.roi > max.roi ? b : max, budgetScenarios[0])?.scenario || "high impact"} periods</li>
              <li>• Balance reach vs frequency based on objectives</li>
              <li>• Monitor competitive activity for timing adjustments</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Timing Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Coordinate flights across channels for synergy</li>
              <li>• Leverage seasonal peaks for maximum impact</li>
              <li>• Test different flight durations for optimal ROI</li>
            </ul>
          </div>
        </div>
      </div>

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
          <p className="text-2xl font-bold text-[#2d2d2d]">{(optimalSpendLevel / 1000).toFixed(1)}K</p>
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

      {/* Strategic Flighting Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Flighting Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Optimal Patterns</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Best pattern: <strong>{flightScenarioROI.reduce((max, f) => f.roi > max.roi ? f : max, flightScenarioROI[0])?.scenario || "Pulsing"}</strong></li>
              <li>• Current saturation: {saturationData.length > 10 ? `${saturationData[10]?.saturation?.toFixed(1)}%` : "N/A"}</li>
              <li>• Optimize spend timing for maximum efficiency</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Budget Optimization</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Focus on {budgetScenarios.reduce((max, b) => b.roi > max.roi ? b : max, budgetScenarios[0])?.scenario || "high impact"} periods</li>
              <li>• Balance reach vs frequency based on objectives</li>
              <li>• Monitor competitive activity for timing adjustments</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Timing Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Coordinate flights across channels for synergy</li>
              <li>• Leverage seasonal peaks for maximum impact</li>
              <li>• Test different flight durations for optimal ROI</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}