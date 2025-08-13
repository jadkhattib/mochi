"use client";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ApiDataResponse } from "@/lib/types";
import { filterRecords, toSeasonBuckets, toChannelSplitSeason, toDayOfWeekPerformance, toHourBucketPerformance, buildSeasonalWhatIfTable } from "@/lib/transform";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function SeasonalPage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const { selectedBrand, selectedMarket, selectedChannels, startDate, endDate } = useDashboard();
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);
  const filtered = useMemo(() => {
    if (!data) return [] as never[];
    return filterRecords(data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels);
  }, [data, selectedBrand, selectedMarket, startDate, endDate, selectedChannels]);

  const seasonBuckets = useMemo(() => (data ? toSeasonBuckets(filtered, data.seasonalBrands, selectedBrand) : []), [filtered, data, selectedBrand]);
  const split = useMemo(() => (data ? toChannelSplitSeason(filtered, data.seasonalBrands, selectedBrand) : { inSeason: [], outSeason: [] }), [filtered, data, selectedBrand]);
  const dow = useMemo(() => (data ? toDayOfWeekPerformance(filtered, true, data.seasonalBrands, selectedBrand) : []), [filtered, data, selectedBrand]);
  const hours = useMemo(() => (data ? toHourBucketPerformance(filtered, true, data.seasonalBrands, selectedBrand) : []), [filtered, data, selectedBrand]);
  const whatIf = useMemo(() => (data ? buildSeasonalWhatIfTable(filtered, data.seasonalBrands, selectedBrand) : []), [filtered, data, selectedBrand]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Seasonal Strategy</h2>
        <p className="text-sm text-black/70">In-season vs out-of-season contribution, pre-season lead, and activation timing</p>
      </header>

      {/* Season Buckets */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="text-sm font-medium mb-3">Season buckets: Spend vs NR</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={seasonBuckets} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="spend" fill="#8884d8" name="Spend" />
            <Bar dataKey="nr" fill="#2d2d2d" name="NR" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Channel split in-season vs out-of-season */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="text-sm font-medium mb-3">In-Season channels (ROI)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={split.inSeason} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="channel" interval={0} angle={-20} height={40} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="roi" fill="#2d2d2d" name="ROI" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="text-sm font-medium mb-3">Out-of-Season channels (ROI)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={split.outSeason} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="channel" interval={0} angle={-20} height={40} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="roi" fill="#8884d8" name="ROI" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day of week and Hour buckets in-season */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="text-sm font-medium mb-3">In-Season day-of-week performance (ROI)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dow} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="roi" fill="#2d2d2d" name="ROI" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <h3 className="text-sm font-medium mb-3">In-Season time-of-day performance (ROI)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hours} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="roi" fill="#8884d8" name="ROI" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What-if table */}
      <div className="rounded-xl bg-white border border-black/10 p-4">
        <h3 className="text-sm font-medium mb-3">Pre-season lead and weight what-if</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-black/70 border-b border-black/10">
                <th className="py-2 pr-4">Lead (weeks)</th>
                <th className="py-2 pr-4">Weight increase</th>
                <th className="py-2 pr-4">Est. Δ NR</th>
              </tr>
            </thead>
            <tbody>
              {whatIf.map((x, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-2 pr-4">{x.leadWeeks}</td>
                  <td className="py-2 pr-4">{Math.round(x.weightIncrease * 100)}%</td>
                  <td className="py-2 pr-4">${Math.round(x.estDeltaNR).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


