"use client";
import { createContext, useContext, useMemo, useRef, useState, useCallback } from "react";
import type { BrandId, ChannelId, MarketId, DashboardContextState } from "@/lib/types";
import type { ChartContextPayload } from "@/lib/chartContext";

type DashboardContextValue = {
  selectedBrand: BrandId | "All";
  setSelectedBrand: (b: BrandId | "All") => void;
  selectedMarket: MarketId | "All";
  setSelectedMarket: (m: MarketId | "All") => void;
  selectedChannels: ChannelId[] | "All";
  setSelectedChannels: (c: ChannelId[] | "All") => void;
  startDate: string;
  endDate: string;
  setDates: (s: string, e: string) => void;
  registerChartContext: (id: string, payload: ChartContextPayload) => void;
  getContext: () => DashboardContextState & { market: MarketId | "All"; charts: Record<string, ChartContextPayload> };
};

const Ctx = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedBrand, setSelectedBrand] = useState<BrandId | "All">("All");
  const [selectedMarket, setSelectedMarket] = useState<MarketId | "All">("All");
  const [selectedChannels, setSelectedChannels] = useState<ChannelId[] | "All">("All");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const chartContexts = useRef<Record<string, ChartContextPayload>>({});

  function setDates(s: string, e: string) {
    setStartDate(s);
    setEndDate(e);
  }

  function registerChartContext(id: string, payload: ChartContextPayload) {
    chartContexts.current[id] = payload;
  }

  const getContext = useCallback((): DashboardContextState & { market: MarketId | "All"; charts: Record<string, ChartContextPayload> } => {
    return {
      selectedBrand,
      startDate,
      endDate,
      aggregation: "daily",
      selectedChannels,
      activeChartId: undefined,
      market: selectedMarket,
      charts: chartContexts.current,
    };
  }, [selectedBrand, startDate, endDate, selectedChannels, selectedMarket]);

  const value = useMemo<DashboardContextValue>(() => ({
    selectedBrand,
    setSelectedBrand,
    selectedMarket,
    setSelectedMarket,
    selectedChannels,
    setSelectedChannels,
    startDate,
    endDate,
    setDates,
    registerChartContext,
    getContext,
  }), [selectedBrand, selectedMarket, selectedChannels, startDate, endDate, getContext]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard() {
  const v = useContext(Ctx);
  if (!v) throw new Error("DashboardProvider missing");
  return v;
}


