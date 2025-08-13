"use client";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRegistration } from "@/lib/chartContext";

interface TimeSeriesProps {
  id: string;
  data: Array<{ date: string; nr: number; spend: number }>;
  registerContext: ChartRegistration;
}

export function TimeSeriesNRSpend({ id, data, registerContext }: TimeSeriesProps) {
  const chartData = useMemo(() => data, [data]);
  registerContext(id, { type: "timeseries", metrics: ["nr", "spend"], points: chartData.slice(-30) });
  return (
    <div className="rounded-xl bg-white border border-black/10 p-3">
      <h3 className="text-sm font-medium mb-2">NR and Spend over time</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2d2d2d" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2d2d2d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="date" hide tick={{ fontSize: 10 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Area type="monotone" yAxisId="left" dataKey="nr" stroke="#2d2d2d" fill="url(#g1)" name="NR" />
          <Line type="monotone" yAxisId="right" dataKey="spend" stroke="#8884d8" dot={false} name="Spend" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StackedProps {
  id: string;
  data: Array<{ channel: string; spend: number; nr: number; roi: number }>;
  registerContext: ChartRegistration;
}

export function ChannelContribution({ id, data, registerContext }: StackedProps) {
  registerContext(id, { type: "channels", data });
  return (
    <div className="rounded-xl bg-white border border-black/10 p-3">
      <h3 className="text-sm font-medium mb-2">Channel contribution</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="channel" tick={{ fontSize: 10 }} angle={-20} height={40} interval={0} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="spend" stackId="a" fill="#8884d8" name="Spend" />
          <Bar dataKey="nr" stackId="a" fill="#2d2d2d" name="NR" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ScatterProps {
  id: string;
  data: Array<{ spend: number; roi: number; channel: string }>;
  registerContext: ChartRegistration;
}

export function ROIvsSpend({ id, data, registerContext }: ScatterProps) {
  registerContext(id, { type: "roi-vs-spend", data });
  return (
    <div className="rounded-xl bg-white border border-black/10 p-3">
      <h3 className="text-sm font-medium mb-2">ROI vs Spend</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="spend" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="roi" stroke="#2d2d2d" dot={true} name="ROI" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


