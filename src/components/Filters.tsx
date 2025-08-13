"use client";
import { useState } from "react";
import { ALL_BRANDS, ALL_CHANNELS, BrandId, ALL_MARKETS, MarketId } from "@/lib/types";
import { useDashboard } from "@/context/DashboardContext";

export function Filters() {
  const {
    selectedBrand,
    setSelectedBrand,
    selectedMarket,
    setSelectedMarket,
    selectedChannels,
    setSelectedChannels,
    startDate,
    endDate,
    setDates,
  } = useDashboard();

  const [channelsExpanded, setChannelsExpanded] = useState(false);
  const allChannels = ALL_CHANNELS;

  const channelCount = selectedChannels === "All" ? allChannels.length : Array.isArray(selectedChannels) ? selectedChannels.length : 0;

  return (
    <div className="bg-white/80 backdrop-blur border border-black/10 rounded-2xl p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
        {/* Brand Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-black/70 uppercase tracking-wide">Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value as BrandId | "All")}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2d2d2d]/20 focus:border-[#2d2d2d]/40 transition-all"
          >
            <option value="All">All Brands</option>
            {ALL_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Market Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-black/70 uppercase tracking-wide">Market</label>
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value as MarketId | "All")}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2d2d2d]/20 focus:border-[#2d2d2d]/40 transition-all"
          >
            <option value="All">All Markets</option>
            {ALL_MARKETS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-black/70 uppercase tracking-wide">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setDates(e.target.value, endDate)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2d2d2d]/20 focus:border-[#2d2d2d]/40 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-black/70 uppercase tracking-wide">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setDates(startDate, e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2d2d2d]/20 focus:border-[#2d2d2d]/40 transition-all"
          />
        </div>

        {/* Channels Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-black/70 uppercase tracking-wide">Channels</label>
          <button
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2d2d2d]/20 focus:border-[#2d2d2d]/40 transition-all text-left flex items-center justify-between"
          >
            <span>{channelCount} of {allChannels.length} selected</span>
            <svg className={`w-4 h-4 transition-transform ${channelsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Channels */}
      {channelsExpanded && (
        <div className="mt-4 pt-4 border-t border-black/10">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSelectedChannels("All")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedChannels === "All" 
                  ? "bg-[#2d2d2d] text-white" 
                  : "bg-white border border-black/10 text-black/70 hover:bg-black/5"
              }`}
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedChannels([])}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                Array.isArray(selectedChannels) && selectedChannels.length === 0
                  ? "bg-[#2d2d2d] text-white" 
                  : "bg-white border border-black/10 text-black/70 hover:bg-black/5"
              }`}
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {allChannels.map((c) => {
              const isOn = selectedChannels === "All" || (Array.isArray(selectedChannels) && selectedChannels.includes(c));
              return (
                <label key={c} className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={(e) => {
                      if (selectedChannels === "All") {
                        setSelectedChannels(e.target.checked ? allChannels : []);
                      } else {
                        const current = new Set(selectedChannels);
                        if (e.target.checked) current.add(c);
                        else current.delete(c);
                        setSelectedChannels(Array.from(current));
                      }
                    }}
                    className="rounded border-black/20 text-[#2d2d2d] focus:ring-[#2d2d2d]/20"
                  />
                  <span className="text-sm">{c}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


