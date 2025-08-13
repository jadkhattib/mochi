"use client";
import { useEffect, useState } from "react";
import { ApiDataResponse } from "@/lib/types";
import { ChannelParamsTable } from "@/components/ChannelTable";

export default function ParamsPage() {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then((d: ApiDataResponse) => setData(d));
  }, []);
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-semibold">Data Parameters</h2>
        <p className="text-sm text-black/70">Half-life, thresholds, max marginal ROI, max ROI, saturation</p>
      </header>
      {data ? <ChannelParamsTable params={data.channels} /> : null}
    </div>
  );
}


