"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { filterRecords, toChannelContribution } from "@/lib/transform";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter } from "recharts";

export default function OptimizePage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const [optimizationGoal, setOptimizationGoal] = useState<"ROI" | "Sales" | "Reach">("ROI");
  const [budgetScenario, setBudgetScenario] = useState<"Current" | "Increase" | "Decrease">("Current");
  const [riskTolerance, setRiskTolerance] = useState<"Conservative" | "Moderate" | "Aggressive">("Moderate");
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();

  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  const contrib = toChannelContribution(filtered);

  // Generate optimization analytics
  const mediaMixOptimization = useMemo(() => {
    const totalCurrentSpend = contrib.reduce((sum, c) => sum + c.spend, 0);
    
    return contrib.map(channel => {
      const saturationLevel = (channel.spend / totalCurrentSpend) * 100;
      
      let spendMultiplier = 1.0;
      let recommendation = "Maintain current allocation";
      
      if (channel.roi > 6 && saturationLevel < 25) {
        spendMultiplier = 1.3;
        recommendation = "Increase allocation - high ROI, low saturation";
      } else if (channel.roi > 4 && saturationLevel < 40) {
        spendMultiplier = 1.15;
        recommendation = "Moderate increase - good performance";
      } else if (channel.roi < 3 || saturationLevel > 60) {
        spendMultiplier = 0.8;
        recommendation = "Reduce allocation - low ROI or oversaturated";
      } else if (channel.roi < 2) {
        spendMultiplier = 0.6;
        recommendation = "Significant reduction - poor performance";
      }
      
      const optimizedSpend = channel.spend * spendMultiplier;
      const optimizedROI = channel.roi * (spendMultiplier < 1 ? 1.1 : 0.95);
      const spendChange = ((optimizedSpend - channel.spend) / channel.spend) * 100;
      const nrImpact = optimizedSpend * optimizedROI - channel.nr;
      const efficiency = channel.roi * (channel.spend / totalCurrentSpend) * 100;
      
      return {
        channel: channel.channel,
        currentSpend: channel.spend,
        currentROI: channel.roi,
        optimizedSpend,
        optimizedROI,
        spendChange,
        nrImpact,
        efficiency,
        recommendation
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [contrib]);

  const budgetAllocationScenarios = useMemo(() => {
    const totalSpend = contrib.reduce((sum, c) => sum + c.spend, 0);
    const totalNR = contrib.reduce((sum, c) => sum + c.nr, 0);
    const baseROI = totalSpend > 0 ? totalNR / totalSpend : 0;
    
    const scenarios = [
      { scenario: "Current Mix", tvShare: 60, digitalShare: 40, riskLevel: "Low" },
      { scenario: "TV Focused", tvShare: 70, digitalShare: 30, riskLevel: "Medium" },
      { scenario: "Digital Focused", tvShare: 40, digitalShare: 60, riskLevel: "Medium" },
      { scenario: "Balanced", tvShare: 50, digitalShare: 50, riskLevel: "Low" },
      { scenario: "Digital Heavy", tvShare: 30, digitalShare: 70, riskLevel: "High" },
      { scenario: "TV Heavy", tvShare: 80, digitalShare: 20, riskLevel: "High" }
    ];
    
    return scenarios.map(scenario => {
      const totalBudget = totalSpend * (budgetScenario === "Increase" ? 1.25 : budgetScenario === "Decrease" ? 0.8 : 1.0);
      const tvSpend = totalBudget * (scenario.tvShare / 100);
      const digitalSpend = totalBudget * (scenario.digitalShare / 100);
      
      const tvROI = baseROI * (scenario.tvShare > 60 ? 0.9 : scenario.tvShare < 40 ? 1.1 : 1.0);
      const digitalROI = baseROI * (scenario.digitalShare > 60 ? 0.95 : scenario.digitalShare < 40 ? 1.15 : 1.0);
      
      const totalROI = (tvSpend * tvROI + digitalSpend * digitalROI) / totalBudget;
      const totalNR = totalBudget * totalROI;
      
      const riskMultiplier = scenario.riskLevel === "Low" ? 1.0 : scenario.riskLevel === "Medium" ? 0.95 : 0.9;
      const efficiency = totalROI * riskMultiplier * 100;
      
      return {
        scenario: scenario.scenario,
        totalBudget,
        tvSpend,
        digitalSpend,
        totalROI,
        totalNR,
        tvShare: scenario.tvShare,
        digitalShare: scenario.digitalShare,
        efficiency,
        riskLevel: scenario.riskLevel
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [contrib, budgetScenario]);

  const roiVsReachOptimization = useMemo(() => {
    return contrib.map(channel => {
      const estimatedReach = Math.min(80, (channel.spend / 1000) * (channel.channel === "Linear TV" ? 12 : channel.channel === "Meta" ? 15 : 10));
      const reachCost = estimatedReach > 0 ? channel.spend / estimatedReach : 0;
      
      const roiEfficiency = channel.roi / 5;
      const reachEfficiency = Math.min(estimatedReach / 80, 1);
      const combinedEfficiency = (roiEfficiency + reachEfficiency) / 2;
      
      const optimizedSpend = channel.spend * (0.8 + combinedEfficiency * 0.4);
      const optimizedROI = channel.roi * (optimizedSpend > channel.spend ? 0.95 : 1.05);
      const optimizedReach = estimatedReach * Math.pow(optimizedSpend / channel.spend, 0.6);
      
      return {
        channel: channel.channel,
        currentSpend: channel.spend,
        currentROI: channel.roi,
        currentReach: estimatedReach,
        optimizedSpend,
        optimizedROI,
        optimizedReach,
        efficiency: combinedEfficiency * 100,
        reachCost
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [contrib]);

  const saturationAnalysis = useMemo(() => {
    const results: Array<{ channel: string; spendLevel: number; roi: number; saturationPoint: number; recommendation: string }> = [];
    
    for (const channel of contrib) {
      const spendLevels = [0.5, 1.0, 1.5, 2.0, 3.0];
      
      for (const level of spendLevels) {
        const channelSaturationRate = channel.channel === "Linear TV" ? 0.2 : channel.channel === "Meta" ? 0.15 : 0.18;
        const roi = channel.roi * Math.pow(level, -channelSaturationRate);
        const saturationPoint = (roi / channel.roi) * 100;
        
        let recommendation = "Maintain current level";
        if (saturationPoint > 90) recommendation = "Operating at peak efficiency";
        else if (saturationPoint > 80) recommendation = "Near optimal";
        else if (saturationPoint > 60) recommendation = "Room for growth";
        else recommendation = "High saturation, reduce spend";
        
        results.push({
          channel: channel.channel,
          spendLevel: level,
          roi,
          saturationPoint,
          recommendation
        });
      }
    }
    
    return results;
  }, [contrib]);

  const colors = ["#2d2d2d", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"];
  
  // Calculate insights
  const totalSpend = contrib.reduce((s, r) => s + r.spend, 0);
  const totalNR = contrib.reduce((s, r) => s + r.nr, 0);
  const currentROI = totalSpend > 0 ? totalNR / totalSpend : 0;
  const bestScenario = budgetAllocationScenarios.length > 0 ? budgetAllocationScenarios[0] : null;
  const potentialUplift = mediaMixOptimization.reduce((sum, m) => sum + m.nrImpact, 0);
  const avgEfficiency = mediaMixOptimization.reduce((sum, m) => sum + m.efficiency, 0) / mediaMixOptimization.length;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Budget Optimization</h2>
        <p className="text-sm text-black/70">Media mix optimization, scenario planning, and efficiency frontier analysis</p>
      </header>

      {/* Strategic Optimization Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Optimization Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Portfolio Strategy</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Best allocation: <strong>{bestScenario?.scenario || "Current + 20%"}</strong> ({bestScenario?.roi.toFixed(2) || "5.8"} ROI)</li>
              <li>• Focus on {optimizationGoal === "ROI" ? "efficiency" : "reach"} optimization</li>
              <li>• {riskTolerance === "Conservative" ? "Gradual" : "Aggressive"} reallocation strategy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Channel Mix</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Diversify across {optimizedAllocation.length} high-performing channels</li>
              <li>• Monitor saturation levels for timing adjustments</li>
              <li>• Balance reach vs frequency based on objectives</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Implementation</h4>
            <ul className="space-y-1 text-black/70">
              <li>• Test budget shifts gradually for validation</li>
              <li>• Monitor competitive activity for opportunities</li>
              <li>• Regular optimization based on performance data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Optimization Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-3">Optimization Goal</h3>
          <div className="flex flex-wrap gap-2">
            {["ROI", "Sales", "Reach"].map(goal => (
              <button 
                key={goal}
                onClick={() => setOptimizationGoal(goal as "ROI" | "Sales" | "Reach")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  optimizationGoal === goal ? "bg-[#2d2d2d] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-3">Budget Scenario</h3>
          <select 
            value={budgetScenario}
            onChange={(e) => setBudgetScenario(e.target.value as "Current" | "Increase" | "Decrease")}
            className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="Current">Current Budget</option>
            <option value="Increase">+25% Budget</option>
            <option value="Decrease">-20% Budget</option>
          </select>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-3">Risk Tolerance</h3>
          <select 
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(e.target.value as "Conservative" | "Moderate" | "Aggressive")}
            className="w-full px-3 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="Conservative">Conservative</option>
            <option value="Moderate">Moderate</option>
            <option value="Aggressive">Aggressive</option>
          </select>
        </div>
      </div>

      {/* Key Optimization Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Current ROI</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{currentROI.toFixed(2)}</p>
          <p className="text-xs text-black/60 mt-1">Baseline performance</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Best Scenario</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{bestScenario?.scenario || "N/A"}</p>
          <p className="text-xs text-black/60 mt-1">ROI: {bestScenario?.totalROI.toFixed(2) || "0.00"}</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Potential Uplift</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">${(potentialUplift / 1000).toFixed(0)}K</p>
          <p className="text-xs text-black/60 mt-1">Incremental NR</p>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium text-sm mb-2">Efficiency Score</h3>
          <p className="text-2xl font-bold text-[#2d2d2d]">{avgEfficiency.toFixed(1)}</p>
          <p className="text-xs text-black/60 mt-1">Weighted average</p>
        </div>
      </div>

      {/* Media Mix Optimization & Budget Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Optimized Media Mix Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mediaMixOptimization.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? (name === 'spendChange' ? (value > 0 ? '+' : '') + value.toFixed(1) + '%' : value.toFixed(2)) : value, 
                  name === 'currentROI' ? 'Current ROI' : name === 'optimizedROI' ? 'Optimized ROI' : name === 'spendChange' ? 'Spend Change' : name
                ]}
              />
              <Bar dataKey="currentROI" fill="#8dd1e1" name="Current ROI" />
              <Bar dataKey="optimizedROI" fill="#2d2d2d" name="Optimized ROI" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Budget Allocation Scenarios ({budgetScenario})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetAllocationScenarios}>
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
                  name === 'totalROI' ? 'Total ROI' : name === 'efficiency' ? 'Efficiency Score' : name
                ]}
              />
              <Bar dataKey="totalROI" name="Total ROI">
                {budgetAllocationScenarios.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.riskLevel === "Low" ? "#82ca9d" : entry.riskLevel === "Medium" ? "#8884d8" : "#ff7300"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROI vs Reach Optimization & Saturation Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">ROI vs Reach Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={roiVsReachOptimization}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="currentReach" name="Reach %" tick={{ fontSize: 12 }} />
              <YAxis dataKey="currentROI" name="ROI" tick={{ fontSize: 12 }} />
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
                  name === 'currentROI' ? 'ROI' : name === 'currentReach' ? 'Reach %' : name === 'efficiency' ? 'Efficiency' : name
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.channel;
                  }
                  return '';
                }}
              />
              {roiVsReachOptimization.map((entry, index) => (
                <Scatter 
                  key={entry.channel}
                  data={[entry]} 
                  fill={colors[index % colors.length]} 
                  name={entry.channel}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="font-medium mb-4">Channel Saturation Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={saturationAnalysis.filter(s => s.spendLevel <= 3.0)}>
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
                  name === 'roi' ? 'ROI' : name === 'saturationPoint' ? 'Saturation %' : name
                ]}
              />
              <Legend />
              {contrib.slice(0, 4).map((channel, index) => (
                <Line 
                  key={channel.channel}
                  type="monotone" 
                  dataKey="roi" 
                  data={saturationAnalysis.filter(s => s.channel === channel.channel && s.spendLevel <= 3.0)}
                  stroke={colors[index % colors.length]} 
                  strokeWidth={2} 
                  name={channel.channel}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimization Recommendations Table */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="font-medium mb-4">Channel Optimization Recommendations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 px-3 font-medium">Channel</th>
                <th className="text-right py-2 px-3 font-medium">Current Spend</th>
                <th className="text-right py-2 px-3 font-medium">Current ROI</th>
                <th className="text-right py-2 px-3 font-medium">Optimized Spend</th>
                <th className="text-right py-2 px-3 font-medium">Optimized ROI</th>
                <th className="text-right py-2 px-3 font-medium">Change</th>
                <th className="text-right py-2 px-3 font-medium">NR Impact</th>
                <th className="text-left py-2 px-3 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {mediaMixOptimization.map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 hover:bg-black/5">
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                      {row.channel}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">${row.currentSpend.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-bold">{row.currentROI.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">${row.optimizedSpend.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-bold">{row.optimizedROI.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.spendChange > 0 ? "bg-green-100 text-green-800" :
                      row.spendChange < 0 ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {row.spendChange > 0 ? '+' : ''}{row.spendChange.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className={row.nrImpact > 0 ? "text-green-600" : row.nrImpact < 0 ? "text-red-600" : "text-gray-600"}>
                      {row.nrImpact > 0 ? '+' : ''}${(row.nrImpact / 1000).toFixed(0)}K
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs max-w-xs">{row.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Optimization Recommendations */}
      <div className="rounded-xl bg-gradient-to-r from-[#f3f2ef] to-white border border-black/10 p-4">
        <h3 className="font-medium mb-3">Strategic Optimization Recommendations</h3>
    </div>
  );
}
