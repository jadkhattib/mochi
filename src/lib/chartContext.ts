export type TimeseriesPoint = { date: string; nr: number; spend: number };
export type ChannelRow = { channel: string; spend: number; nr: number; roi: number };
export type RoiSpendPoint = { spend: number; roi: number; channel: string };

export type ChartContextPayload =
  | { type: "timeseries"; metrics: string[]; points: TimeseriesPoint[] }
  | { type: "channels"; data: ChannelRow[] }
  | { type: "roi-vs-spend"; data: RoiSpendPoint[] };

export type ChartRegistration = (id: string, payload: ChartContextPayload) => void;


