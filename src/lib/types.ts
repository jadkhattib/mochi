export type BrandId = "Brand A" | "Brand B" | "Brand C" | "Brand D" | "Brand E" | "Brand F";

export type MarketId =
  | "US"
  | "Canada"
  | "UK"
  | "Germany"
  | "France"
  | "UAE"
  | "India"
  | "Brazil";

export type MarketGroup = "NAC" | "EU" | "MEA" | "APAC" | "LATAM";

export type ChannelId =
  | "Linear TV"
  | "CTV"
  | "OLV"
  | "BVOD"
  | "Meta"
  | "Google"
  | "TikTok"
  | "Amazon"
  | "Promo"
  | "Owned"
  | "Earned";

export type Format = "Video" | "Static";
export type Daypart = "Prime" | "Off-Prime";
export type FunnelStage = "Awareness" | "Consideration" | "Conversion";
export type BuyingType = "Awareness" | "Engagement" | "Click" | "Lead";
export type TargetingType = "BAU W25-54" | "CDP 1P" | "Strategy Segment";
export type Publisher = "Meta" | "Google" | "TikTok" | "Amazon" | "YouTube" | "DV360";

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  brand: BrandId;
  market: MarketId;
  marketGroup: MarketGroup;
  channel: ChannelId;
  spend: number; // currency
  impressions: number;
  grps?: number; // for TV related
  reach: number; // people reached (dummy)
  frequency: number; // avg frequency (dummy)
  viewability?: number; // 0..1 for digital
  vtr?: number; // view-through rate 0..1 for video
  nr: number; // Net Revenue for the brand on that day (aggregate across channels when summed)
  roi: number; // per-channel ROI estimate for that day
  // Extended fields for deep-dive analysis
  format?: Format; // Video vs Static
  daypart?: Daypart;
  hourBucket?: "Morning" | "Day" | "Evening" | "Night";
  dayOfWeek: number; // 0=Sun..6=Sat
  funnelStage?: FunnelStage;
  buyingType?: BuyingType;
  targeting?: TargetingType;
  publisher?: Publisher;
  campaignName?: string;
  copyName?: string; // normalized naming
  copyLengthSec?: 6 | 10 | 15 | 30;
  isRetailMedia?: boolean;
  isConsumerMedia?: boolean;
  isPromo?: boolean;
}

export interface ChannelParams {
  channel: ChannelId;
  halfLifeDays?: number; // for adstock
  minThresholdSpend: number; // below which effects minimal
  maxMarginalROI: number; // at near-zero spend
  maxROI: number; // theoretical cap
  saturationPointSpend: number; // where marginal returns ~0
}

export interface HaloMatrixEntry {
  fromBrand: BrandId;
  toBrand: BrandId;
  strength: number; // -1..1 (negative to positive halo)
}

export interface DashboardContextState {
  selectedBrand: BrandId | "All";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  aggregation: "daily" | "weekly";
  selectedChannels: ChannelId[] | "All";
  activeChartId?: string;
}

export interface ApiDataResponse {
  records: DailyRecord[];
  channels: ChannelParams[];
  halo: HaloMatrixEntry[];
  seasonalBrands: BrandId[];
  channelSynergy: Array<{ channelA: ChannelId; channelB: ChannelId; strength: number }>;
  markets: MarketId[];
}

export const ALL_BRANDS: BrandId[] = [
  "Brand A",
  "Brand B",
  "Brand C",
  "Brand D",
  "Brand E",
  "Brand F",
];

export const ALL_CHANNELS: ChannelId[] = [
  "Linear TV",
  "CTV",
  "OLV",
  "BVOD",
  "Meta",
  "Google",
  "TikTok",
  "Amazon",
  "Promo",
  "Owned",
  "Earned",
];

export const ALL_MARKETS: MarketId[] = [
  "US",
  "Canada",
  "UK",
  "Germany",
  "France",
  "UAE",
  "India",
  "Brazil",
];

export function marketToGroup(m: MarketId): MarketGroup {
  switch (m) {
    case "US":
    case "Canada":
      return "NAC";
    case "UK":
    case "Germany":
    case "France":
      return "EU";
    case "UAE":
      return "MEA";
    case "India":
      return "APAC";
    case "Brazil":
      return "LATAM";
  }
}


