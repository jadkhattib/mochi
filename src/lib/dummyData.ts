import { eachDayOfInterval, format } from "date-fns";
import {
  ALL_BRANDS,
  ALL_CHANNELS,
  ALL_MARKETS,
  ApiDataResponse,
  BrandId,
  ChannelId,
  ChannelParams,
  DailyRecord,
  HaloMatrixEntry,
  MarketId,
  marketToGroup,
  Publisher,
  BuyingType,
  FunnelStage,
  Daypart,
  TargetingType,
} from "./types";

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const start = new Date("2024-01-01");
const end = new Date("2024-12-31");
const days = eachDayOfInterval({ start, end });

// Define seasonal brands (e.g., C and E are seasonal)
const seasonalBrands: BrandId[] = ["Brand C", "Brand E"];

// Channel parameters (dummy MMM-like knobs)
const channelParams: ChannelParams[] = [
  { channel: "Linear TV", halfLifeDays: 10, minThresholdSpend: 2000, maxMarginalROI: 6, maxROI: 4, saturationPointSpend: 80000 },
  { channel: "CTV", halfLifeDays: 9, minThresholdSpend: 1500, maxMarginalROI: 5, maxROI: 3.5, saturationPointSpend: 60000 },
  { channel: "OLV", halfLifeDays: 7, minThresholdSpend: 1000, maxMarginalROI: 4, maxROI: 3, saturationPointSpend: 45000 },
  { channel: "BVOD", halfLifeDays: 8, minThresholdSpend: 1200, maxMarginalROI: 4.5, maxROI: 3.2, saturationPointSpend: 50000 },
  { channel: "Meta", halfLifeDays: 6, minThresholdSpend: 600, maxMarginalROI: 5.5, maxROI: 4, saturationPointSpend: 35000 },
  { channel: "Google", halfLifeDays: 5, minThresholdSpend: 700, maxMarginalROI: 4.8, maxROI: 3.5, saturationPointSpend: 32000 },
  { channel: "TikTok", halfLifeDays: 5, minThresholdSpend: 500, maxMarginalROI: 5.2, maxROI: 3.6, saturationPointSpend: 28000 },
  { channel: "Amazon", halfLifeDays: 4, minThresholdSpend: 800, maxMarginalROI: 6, maxROI: 4.2, saturationPointSpend: 40000 },
  { channel: "Promo", halfLifeDays: 2, minThresholdSpend: 1000, maxMarginalROI: 7, maxROI: 5, saturationPointSpend: 90000 },
  { channel: "Owned", halfLifeDays: 10, minThresholdSpend: 0, maxMarginalROI: 3, maxROI: 2, saturationPointSpend: 5000 },
  { channel: "Earned", halfLifeDays: 14, minThresholdSpend: 0, maxMarginalROI: 2, maxROI: 1.5, saturationPointSpend: 2000 },
];

// Halo effects between brands (symmetric-ish dummy values)
const halo: HaloMatrixEntry[] = (() => {
  const list: HaloMatrixEntry[] = [];
  for (const from of ALL_BRANDS) {
    for (const to of ALL_BRANDS) {
      if (from === to) continue;
      const strength =
        from.includes("Brand ") && to.includes("Brand ")
          ? ["A", "B", "C"].some((c) => from.endsWith(c) && ["A", "B", "C"].some((d) => to.endsWith(d)))
            ? randomInRange(0.05, 0.2)
            : randomInRange(-0.05, 0.12)
          : randomInRange(-0.03, 0.1);
      list.push({ fromBrand: from, toBrand: to, strength: Number(strength.toFixed(3)) });
    }
  }
  return list;
})();

// Channel synergy matrix (channel-channel portfolio performance synergy)
const channelSynergy: Array<{ channelA: ChannelId; channelB: ChannelId; strength: number }> = (() => {
  const list: Array<{ channelA: ChannelId; channelB: ChannelId; strength: number }> = [];
  for (let i = 0; i < ALL_CHANNELS.length; i++) {
    for (let j = i + 1; j < ALL_CHANNELS.length; j++) {
      const a = ALL_CHANNELS[i];
      const b = ALL_CHANNELS[j];
      const base = (a.includes("TV") || a === "CTV" ? 0.08 : 0.04) + (b.includes("TV") || b === "CTV" ? 0.08 : 0.04);
      const strength = +(randomInRange(base - 0.05, base + 0.1).toFixed(3));
      list.push({ channelA: a, channelB: b, strength });
    }
  }
  return list;
})();

// Helper to shape seasonality by brand
function seasonalMultiplier(date: Date, brand: BrandId): number {
  const month = date.getUTCMonth() + 1; // 1..12
  if (seasonalBrands.includes(brand)) {
    // Peak season: May-Sep
    if (month >= 5 && month <= 9) return 1.3;
    // Pre-season ramp: Mar-Apr
    if (month >= 3 && month <= 4) return 1.1;
    // Post-season tail: Oct
    if (month === 10) return 1.05;
    return 0.85;
  }
  // Non-seasonal small monthly variation
  const variation = [1.0, 1.02, 0.98, 1.0, 1.05, 1.03, 1.02, 0.97, 0.99, 1.01, 1.0, 1.02][month - 1];
  return variation;
}

// Generate base daily net revenue by brand (aggregate, then we split per channel via contributions)
function baseBrandNR(brand: BrandId): number {
  switch (brand) {
    case "Brand A":
      return 300000; // per day baseline before seasonality factors (dummy)
    case "Brand B":
      return 220000;
    case "Brand C":
      return 180000;
    case "Brand D":
      return 250000;
    case "Brand E":
      return 160000;
    case "Brand F":
      return 140000;
  }
}

function channelWeight(channel: ChannelId): number {
  const weights: Record<ChannelId, number> = {
    "Linear TV": 0.18,
    CTV: 0.1,
    OLV: 0.09,
    BVOD: 0.06,
    Meta: 0.17,
    Google: 0.16,
    TikTok: 0.08,
    "Amazon": 0.07,
    Promo: 0.06,
    Owned: 0.02,
    Earned: 0.01,
  };
  return weights[channel];
}

function computeAdstockedEffect(spend: number, params: ChannelParams): number {
  // Simple diminishing returns curve with min threshold and saturation
  const effectiveSpend = Math.max(0, spend - params.minThresholdSpend);
  const saturation = params.saturationPointSpend;
  const x = Math.min(1, effectiveSpend / saturation);
  // Map to ROI between maxMarginalROI and maxROI with concavity
  const roi = params.maxROI - (params.maxROI - params.maxMarginalROI) * Math.exp(-3 * x);
  return Math.max(0, roi);
}

function randAround(base: number, pct: number, r: () => number): number {
  const delta = (r() - 0.5) * 2 * pct * base;
  return Math.max(0, base + delta);
}

let DATA_CACHE: ApiDataResponse | null = null;

export function generateDummyData(): ApiDataResponse {
  const rng = seededRandom(2024);
  const records: DailyRecord[] = [];

  for (const date of days) {
    for (const brand of ALL_BRANDS) {
      const seasonMult = seasonalMultiplier(date, brand);
      const brandBaseNR = baseBrandNR(brand) * seasonMult;

      // Total daily spend target per brand fluctuates
      const totalBrandSpend = randAround(brandBaseNR * 0.08, 0.25, rng);

      for (const channel of ALL_CHANNELS) {
        // market assignment
        const market: MarketId = ALL_MARKETS[Math.floor(rng() * ALL_MARKETS.length)];
        const marketGroup = marketToGroup(market);

        const w = channelWeight(channel);
        const spend = randAround(totalBrandSpend * w, 0.3, rng);
        const params = channelParams.find((c) => c.channel === channel)!;
        const roi = computeAdstockedEffect(spend, params);

        const impressions = Math.round(spend * randAround(30, 0.3, rng));
        const reach = Math.round(impressions * randAround(0.3, 0.2, rng));
        const frequency = impressions > 0 && reach > 0 ? +(impressions / Math.max(1, reach)).toFixed(2) : 0;
        const viewability = ["Meta", "Google", "TikTok", "OLV", "CTV", "BVOD", "Amazon"].includes(channel)
          ? +randAround(0.6, 0.15, rng).toFixed(2)
          : undefined;
        const vtr = ["OLV", "CTV", "BVOD", "Meta", "TikTok"].includes(channel)
          ? +randAround(0.35, 0.2, rng).toFixed(2)
          : undefined;
        const grps = ["Linear TV", "CTV", "BVOD"].includes(channel) ? +randAround(80, 0.4, rng).toFixed(2) : undefined;

        // extended attributes
        const adFormat = ["Meta", "Google", "TikTok", "OLV", "CTV", "BVOD"].includes(channel) ? (rng() > 0.35 ? "Video" : "Static") : "Video";
        const daypart: Daypart | undefined = ["Linear TV", "CTV", "BVOD"].includes(channel)
          ? rng() > 0.6
            ? "Prime"
            : "Off-Prime"
          : undefined;
        const hourBucket: "Morning" | "Day" | "Evening" | "Night" | undefined = ["Meta", "Google", "TikTok", "OLV", "CTV", "BVOD"].includes(channel)
          ? (() => {
              const r = rng();
              if (r < 0.25) return "Morning";
              if (r < 0.6) return "Day";
              if (r < 0.9) return "Evening";
              return "Night";
            })()
          : undefined;
        const dayOfWeek = date.getUTCDay();
        const funnelStage: FunnelStage | undefined = ["Linear TV", "CTV", "BVOD"].includes(channel)
          ? "Awareness"
          : rng() > 0.5
          ? "Consideration"
          : "Conversion";
        const buyingType: BuyingType | undefined = channel === "Meta"
          ? (rng() < 0.25 ? "Awareness" : rng() < 0.5 ? "Engagement" : rng() < 0.8 ? "Click" : "Lead")
          : undefined;
        const targeting: TargetingType | undefined = rng() < 0.5 ? "BAU W25-54" : rng() < 0.8 ? "Strategy Segment" : "CDP 1P";
        const publisher: Publisher | undefined = channel === "Meta" ? "Meta" : channel === "Google" ? (rng() > 0.5 ? "Google" : "YouTube") : channel === "TikTok" ? "TikTok" : channel === "Amazon" ? "Amazon" : channel === "OLV" ? "DV360" : undefined;
        const copyLengthSec: 6 | 10 | 15 | 30 | undefined = adFormat === "Video" ? ([6, 10, 15, 30] as const)[Math.floor(rng() * 4)] : undefined;
        const campaignName = `${brand} ${market} ${adFormat} ${channel} Campaign`;
        const copyName = `${adFormat}-${copyLengthSec ?? 0}s`;
        const isRetailMedia = channel === "Amazon";
        const isPromo = channel === "Promo";
        const isConsumerMedia = !isRetailMedia && !isPromo;

        const channelNR = spend * roi * randAround(1.0, 0.05, rng);

        records.push({
          date: format(date, "yyyy-MM-dd"),
          brand,
          market,
          marketGroup,
          channel,
          spend: +spend.toFixed(2),
          impressions,
          grps,
          reach,
          frequency,
          viewability,
          vtr,
          nr: +channelNR.toFixed(2),
          roi: +roi.toFixed(2),
          format: adFormat,
          daypart,
          hourBucket,
          dayOfWeek,
          funnelStage,
          buyingType,
          targeting,
          publisher,
          campaignName,
          copyName,
          copyLengthSec,
          isRetailMedia,
          isPromo,
          isConsumerMedia,
        });
      }
    }
  }

  return { records, channels: channelParams, halo, seasonalBrands, channelSynergy, markets: ALL_MARKETS };
}

export function getCachedData(): ApiDataResponse {
  if (DATA_CACHE) return DATA_CACHE;
  DATA_CACHE = generateDummyData();
  return DATA_CACHE;
}


