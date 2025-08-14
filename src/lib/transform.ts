import { ApiDataResponse, BrandId, ChannelId, DailyRecord, MarketId } from "./types";
import { parseISO, getISOWeek, getISOWeekYear } from "date-fns";

function inRange(date: string, start: string, end: string): boolean {
  const d = parseISO(date).getTime();
  return d >= parseISO(start).getTime() && d <= parseISO(end).getTime();
}

export function filterRecords(
  data: ApiDataResponse,
  brand: BrandId | "All",
  market: MarketId | "All",
  start: string,
  end: string,
  channels: ChannelId[] | "All"
): DailyRecord[] {
  return data.records.filter((r) => {
    if (!inRange(r.date, start, end)) return false;
    if (brand !== "All" && r.brand !== brand) return false;
    if (market !== "All" && r.market !== market) return false;
    if (channels !== "All" && !channels.includes(r.channel)) return false;
    return true;
  });
}

export function toTimeseries(records: DailyRecord[], sampleEveryN = 2): Array<{ date: string; nr: number; spend: number }> {
  const byDate = new Map<string, { date: string; nr: number; spend: number }>();
  for (const r of records) {
    const key = r.date;
    const prev = byDate.get(key) ?? { date: r.date, nr: 0, spend: 0 };
    prev.nr += r.nr;
    prev.spend += r.spend;
    byDate.set(key, prev);
  }
  const sorted = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length > 200) {
    return sorted.filter((_, idx) => idx % sampleEveryN === 0);
  }
  return sorted;
}

export function toTimeseriesWeekly(records: DailyRecord[]): Array<{ date: string; nr: number; spend: number }> {
  const byWeek = new Map<string, { date: string; nr: number; spend: number }>();
  for (const r of records) {
    const d = parseISO(r.date);
    const week = getISOWeek(d);
    const year = getISOWeekYear(d);
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    const prev = byWeek.get(key) ?? { date: key, nr: 0, spend: 0 };
    prev.nr += r.nr;
    prev.spend += r.spend;
    byWeek.set(key, prev);
  }
  return Array.from(byWeek.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function toChannelContribution(records: DailyRecord[]): Array<{ channel: string; spend: number; nr: number; roi: number }> {
  const byCh = new Map<string, { channel: string; spend: number; nr: number }>();
  for (const r of records) {
    const prev = byCh.get(r.channel) ?? { channel: r.channel, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    byCh.set(r.channel, prev);
  }
  return Array.from(byCh.values())
    .map((x) => ({ ...x, roi: x.spend > 0 ? x.nr / x.spend : 0 }))
    .sort((a, b) => b.nr - a.nr);
}

export function toROIvsSpend(records: DailyRecord[], maxPoints = 1000): Array<{ spend: number; roi: number; channel: string }> {
  const pts = records.map((r) => ({ spend: r.spend, roi: r.roi, channel: r.channel }));
  if (pts.length > maxPoints) {
    const step = Math.ceil(pts.length / maxPoints);
    return pts.filter((_, i) => i % step === 0);
  }
  return pts;
}

export function toConsumerVsRetailPromo(records: DailyRecord[]): Array<{ cluster: string; spend: number; nr: number }> {
  const agg = new Map<string, { cluster: string; spend: number; nr: number }>();
  for (const r of records) {
    const cluster = r.isPromo ? "Promo" : r.isRetailMedia ? "Retail Media" : r.isConsumerMedia ? "Consumer Media" : "Other";
    const prev = agg.get(cluster) ?? { cluster, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    agg.set(cluster, prev);
  }
  return Array.from(agg.values()).sort((a, b) => b.nr - a.nr);
}

// MMM Meta Analysis functions

// Media contribution decomposition (Base, Media, Promo, Other)
export function toMediaContributionDecomposition(records: DailyRecord[]) {
  const weeks = new Map<string, { week: string; base: number; media: number; promo: number; other: number; total: number }>();
  
  for (const r of records) {
    const week = r.date.substring(0, 10);
    const prev = weeks.get(week) ?? { week, base: 0, media: 0, promo: 0, other: 0, total: 0 };
    
    // Simulate base vs media contribution (simplified MMM decomposition)
    const totalNR = r.nr;
    const mediaContrib = totalNR * 0.4; // 40% media driven
    const baseContrib = totalNR * 0.35; // 35% base
    const promoContrib = r.channel === 'Promo' ? totalNR * 0.2 : totalNR * 0.15; // 15-20% promo
    const otherContrib = totalNR - mediaContrib - baseContrib - promoContrib;
    
    prev.base += baseContrib;
    prev.media += mediaContrib;
    prev.promo += promoContrib;
    prev.other += Math.max(0, otherContrib);
    prev.total += totalNR;
    weeks.set(week, prev);
  }
  
  return Array.from(weeks.values()).sort((a, b) => a.week.localeCompare(b.week));
}

// Short-term vs Long-term media impact analysis
export function toShortVsLongTermImpact(records: DailyRecord[]) {
  const channels = new Map<ChannelId, { channel: ChannelId; shortTerm: number; longTerm: number; totalImpact: number; adstock: number }>();
  
  for (const r of records) {
    const prev = channels.get(r.channel) ?? { channel: r.channel, shortTerm: 0, longTerm: 0, totalImpact: 0, adstock: 0.6 };
    
    // Simulate short-term (immediate) vs long-term (carryover) effects
    const totalImpact = r.nr;
    const shortTermRate = getShortTermRate(r.channel);
    const shortTerm = totalImpact * shortTermRate;
    const longTerm = totalImpact * (1 - shortTermRate);
    
    prev.shortTerm += shortTerm;
    prev.longTerm += longTerm;
    prev.totalImpact += totalImpact;
    channels.set(r.channel, prev);
  }
  
  return Array.from(channels.values()).sort((a, b) => b.totalImpact - a.totalImpact);
}

function getShortTermRate(channel: ChannelId): number {
  // Different channels have different short vs long-term impact profiles
  const rates: Record<ChannelId, number> = {
    'Linear TV': 0.3, // 30% short-term, 70% long-term
    'CTV': 0.35,
    'OLV': 0.45,
    'BVOD': 0.4,
    'Meta': 0.7, // High short-term impact
    'Google': 0.8, // Very high short-term
    'TikTok': 0.65,
    'Amazon': 0.85, // Mostly short-term
    'Promo': 0.95, // Almost all short-term
    'Owned': 0.5,
    'Earned': 0.6
  };
  return rates[channel] || 0.6;
}

// Saturation curve analysis
export function toSaturationCurveAnalysis(records: DailyRecord[]) {
  // Calculate total portfolio metrics
  const totalSpend = records.reduce((sum, r) => sum + r.spend, 0);
  const totalNR = records.reduce((sum, r) => sum + r.nr, 0);
  const currentROI = totalSpend > 0 ? totalNR / totalSpend : 0;
  
  // Generate single integrated saturation curve for the portfolio
  const points: Array<{ spend: number; nr: number; roi: number; saturation: number; marginalROI: number }> = [];
  const maxSpend = totalSpend * 3; // Extend to 300% of current spend for broader analysis
  const baseEfficiency = totalNR / totalSpend;
  
  for (let i = 0; i <= 30; i++) {
    const spendLevel = (maxSpend / 30) * i;
    
    // Portfolio saturation curve using exponential decay model
    const saturationFactor = 1 - Math.exp(-spendLevel / (totalSpend * 1.2));
    
    // Apply diminishing returns to efficiency
    const efficiency = baseEfficiency * (1 - Math.pow(saturationFactor, 1.5) * 0.4);
    const projectedNR = spendLevel * efficiency;
    const roi = spendLevel > 0 ? projectedNR / spendLevel : 0;
    
    // Calculate marginal ROI (incremental ROI for additional spend)
    const prevPoint = points[i - 1];
    const marginalROI = prevPoint && spendLevel > prevPoint.spend ? 
      (projectedNR - prevPoint.nr) / (spendLevel - prevPoint.spend) : 
      efficiency;
    
    points.push({
      spend: spendLevel,
      nr: projectedNR,
      roi,
      saturation: saturationFactor * 100,
      marginalROI
    });
  }
  
  return points;
}

// Media efficiency frontier analysis
export function toMediaEfficiencyFrontier(records: DailyRecord[]) {
  const channelMetrics = new Map<ChannelId, { reach: number; frequency: number; spend: number; nr: number }>();
  
  for (const r of records) {
    const prev = channelMetrics.get(r.channel) ?? { reach: 0, frequency: 0, spend: 0, nr: 0 };
    prev.reach += r.reach;
    prev.frequency += r.frequency || 1;
    prev.spend += r.spend;
    prev.nr += r.nr;
    channelMetrics.set(r.channel, prev);
  }
  
  return Array.from(channelMetrics.entries()).map(([channelId, ch]) => ({
    channel: channelId,
    reach: ch.reach,
    frequency: ch.frequency,
    spend: ch.spend,
    nr: ch.nr,
    roi: ch.spend > 0 ? ch.nr / ch.spend : 0,
    cpm: ch.reach > 0 ? (ch.spend / ch.reach) * 1000 : 0,
    efficiency: (ch.reach * ch.frequency) / ch.spend // Reach x Frequency per dollar
  }));
}

// Incremental impact analysis
export function toIncrementalImpactAnalysis(records: DailyRecord[]) {
  const weeklyData = new Map<string, { week: string; baselineNR: number; incrementalNR: number; totalNR: number }>();
  
  for (const r of records) {
    const week = r.date.substring(0, 10);
    const prev = weeklyData.get(week) ?? { week, baselineNR: 0, incrementalNR: 0, totalNR: 0 };
    
    // Simulate baseline (organic) vs incremental (media-driven) revenue
    const baseline = r.nr * 0.35; // 35% organic baseline
    const incremental = r.nr * 0.65; // 65% media incremental
    
    prev.baselineNR += baseline;
    prev.incrementalNR += incremental;
    prev.totalNR += r.nr;
    weeklyData.set(week, prev);
  }
  
  return Array.from(weeklyData.values()).sort((a, b) => a.week.localeCompare(b.week));
}

// Channel attribution analysis
export function toChannelAttributionAnalysis(records: DailyRecord[]) {
  const attribution = new Map<ChannelId, { 
    channel: ChannelId; 
    firstTouch: number; 
    lastTouch: number; 
    linear: number; 
    timeDecay: number; 
    positionBased: number;
    totalNR: number;
  }>();
  
  for (const r of records) {
    const prev = attribution.get(r.channel) ?? { 
      channel: r.channel, 
      firstTouch: 0, 
      lastTouch: 0, 
      linear: 0, 
      timeDecay: 0, 
      positionBased: 0,
      totalNR: 0
    };
    
    const nr = r.nr;
    
    // Simulate different attribution models
    prev.firstTouch += nr * 0.2; // 20% first touch
    prev.lastTouch += nr * 0.4; // 40% last touch
    prev.linear += nr * 0.25; // 25% linear
    prev.timeDecay += nr * 0.3; // 30% time decay
    prev.positionBased += nr * 0.35; // 35% position based
    prev.totalNR += nr;
    
    attribution.set(r.channel, prev);
  }
  
  return Array.from(attribution.values()).sort((a, b) => b.totalNR - a.totalNR);
}

export function toDaypartPrimeRatio(records: DailyRecord[]): { prime: number; offPrime: number } {
  let primeSpend = 0;
  let offSpend = 0;
  for (const r of records) {
    if (r.daypart === "Prime") primeSpend += r.spend;
    else if (r.daypart === "Off-Prime") offSpend += r.spend;
  }
  return { prime: primeSpend, offPrime: offSpend };
}

export function toPublisherBench(records: DailyRecord[]): Array<{ publisher: string; roi: number; spend: number; nr: number }> {
  const byPub = new Map<string, { publisher: string; spend: number; nr: number }>();
  for (const r of records) {
    if (!r.publisher) continue;
    const prev = byPub.get(r.publisher) ?? { publisher: r.publisher, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    byPub.set(r.publisher, prev);
  }
  return Array.from(byPub.values()).map((x) => ({ ...x, roi: x.spend > 0 ? x.nr / x.spend : 0 })).sort((a, b) => b.roi - a.roi);
}

export function toFormatPerformance(records: DailyRecord[]): Array<{ format: string; roi: number; spend: number; nr: number }> {
  const byFmt = new Map<string, { format: string; spend: number; nr: number }>();
  for (const r of records) {
    const fmt = r.format ?? "Unknown";
    const prev = byFmt.get(fmt) ?? { format: fmt, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    byFmt.set(fmt, prev);
  }
  return Array.from(byFmt.values()).map((x) => ({ ...x, roi: x.spend > 0 ? x.nr / x.spend : 0 }));
}

export function toCopyLengthPerformance(records: DailyRecord[]): Array<{ length: string; roi: number; spend: number; nr: number }> {
  const byLen = new Map<string, { length: string; spend: number; nr: number }>();
  for (const r of records) {
    const len = r.copyLengthSec ? `${r.copyLengthSec}s` : "N/A";
    const prev = byLen.get(len) ?? { length: len, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    byLen.set(len, prev);
  }
  return Array.from(byLen.values()).map((x) => ({ ...x, roi: x.spend > 0 ? x.nr / x.spend : 0 }));
}

export function toVtrViewabilityImpact(records: DailyRecord[]): Array<{ channel: string; vtr?: number; viewability?: number; roi: number }> {
  const byCh = new Map<string, { channel: string; spend: number; nr: number; vtrSum: number; vCount: number; viewSum: number; viewCount: number }>();
  for (const r of records) {
    const prev = byCh.get(r.channel) ?? { channel: r.channel, spend: 0, nr: 0, vtrSum: 0, vCount: 0, viewSum: 0, viewCount: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    if (typeof r.vtr === "number") {
      prev.vtrSum += r.vtr;
      prev.vCount += 1;
    }
    if (typeof r.viewability === "number") {
      prev.viewSum += r.viewability;
      prev.viewCount += 1;
    }
    byCh.set(r.channel, prev);
  }
  return Array.from(byCh.values()).map((x) => ({ channel: x.channel, vtr: x.vCount ? x.vtrSum / x.vCount : undefined, viewability: x.viewCount ? x.viewSum / x.viewCount : undefined, roi: x.spend ? x.nr / x.spend : 0 }));
}

// Seasonal analytics helpers
type SeasonPeriod = "Off-Season" | "Pre-Season" | "In-Season" | "Post-Season";

function getSeasonPeriod(dateStr: string, isSeasonalBrand: boolean): SeasonPeriod {
  const d = parseISO(dateStr);
  const m = d.getUTCMonth() + 1; // 1..12
  if (!isSeasonalBrand) {
    // For non-seasonal brands, consider all as Off-Season equivalent buckets except mimic months
    if (m >= 5 && m <= 9) return "In-Season";
    if (m >= 3 && m <= 4) return "Pre-Season";
    if (m === 10) return "Post-Season";
    return "Off-Season";
  }
  if (m >= 5 && m <= 9) return "In-Season"; // May-Sep
  if (m >= 3 && m <= 4) return "Pre-Season"; // Mar-Apr
  if (m === 10) return "Post-Season"; // Oct
  return "Off-Season"; // Nov-Feb
}

export function toSeasonBuckets(records: DailyRecord[], seasonalBrands: BrandId[], brand: BrandId | "All") {
  const isSeasonal = brand !== "All" ? seasonalBrands.includes(brand) : true;
  const agg = new Map<SeasonPeriod, { period: SeasonPeriod; spend: number; nr: number }>();
  for (const r of records) {
    const period = getSeasonPeriod(r.date, isSeasonal);
    const prev = agg.get(period) ?? { period, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    agg.set(period, prev);
  }
  return Array.from(agg.values()).map((x) => ({ ...x, roi: x.spend ? x.nr / x.spend : 0 }));
}

export function toChannelSplitSeason(records: DailyRecord[], seasonalBrands: BrandId[], brand: BrandId | "All") {
  const isSeasonal = brand !== "All" ? seasonalBrands.includes(brand) : true;
  const inMap = new Map<string, { channel: string; spend: number; nr: number }>();
  const outMap = new Map<string, { channel: string; spend: number; nr: number }>();
  for (const r of records) {
    const period = getSeasonPeriod(r.date, isSeasonal);
    const target = period === "In-Season" ? inMap : outMap;
    const prev = target.get(r.channel) ?? { channel: r.channel, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    target.set(r.channel, prev);
  }
  const toArr = (m: Map<string, { channel: string; spend: number; nr: number }>) =>
    Array.from(m.values()).map((x) => ({ ...x, roi: x.spend ? x.nr / x.spend : 0 })).sort((a, b) => b.nr - a.nr);
  return { inSeason: toArr(inMap), outSeason: toArr(outMap) };
}

export function toDayOfWeekPerformance(records: DailyRecord[], inSeasonOnly: boolean, seasonalBrands: BrandId[], brand: BrandId | "All") {
  const isSeasonal = brand !== "All" ? seasonalBrands.includes(brand) : true;
  const agg = new Map<number, { day: number; spend: number; nr: number }>();
  for (const r of records) {
    const period = getSeasonPeriod(r.date, isSeasonal);
    if (inSeasonOnly && period !== "In-Season") continue;
    const prev = agg.get(r.dayOfWeek) ?? { day: r.dayOfWeek, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    agg.set(r.dayOfWeek, prev);
  }
  return Array.from(agg.values()).map((x) => ({ ...x, roi: x.spend ? x.nr / x.spend : 0 })).sort((a, b) => a.day - b.day);
}

export function toHourBucketPerformance(records: DailyRecord[], inSeasonOnly: boolean, seasonalBrands: BrandId[], brand: BrandId | "All") {
  const isSeasonal = brand !== "All" ? seasonalBrands.includes(brand) : true;
  const agg = new Map<string, { bucket: string; spend: number; nr: number }>();
  for (const r of records) {
    const period = getSeasonPeriod(r.date, isSeasonal);
    if (inSeasonOnly && period !== "In-Season") continue;
    const bucket = r.hourBucket ?? "Unknown";
    const prev = agg.get(bucket) ?? { bucket, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    agg.set(bucket, prev);
  }
  return Array.from(agg.values()).map((x) => ({ ...x, roi: x.spend ? x.nr / x.spend : 0 }));
}

export function buildSeasonalWhatIfTable(records: DailyRecord[], seasonalBrands: BrandId[], brand: BrandId | "All") {
  const isSeasonal = brand !== "All" ? seasonalBrands.includes(brand) : true;
  const periods = records.map((r) => ({ r, p: getSeasonPeriod(r.date, isSeasonal) }));
  const pre = periods.filter((x) => x.p === "Pre-Season").map((x) => x.r);
  if (pre.length === 0) return [] as Array<{ leadWeeks: number; weightIncrease: number; estDeltaNR: number }>;
  const avgDailySpend = pre.reduce((s, r) => s + r.spend, 0) / pre.length;
  const avgROI = (pre.reduce((s, r) => s + r.nr, 0) / Math.max(1, pre.reduce((s, r) => s + r.spend, 0))) || 0;
  const combos = [
    { leadWeeks: 2, weightIncrease: 0.15 },
    { leadWeeks: 2, weightIncrease: 0.2 },
    { leadWeeks: 2, weightIncrease: 0.4 },
    { leadWeeks: 4, weightIncrease: 0.15 },
    { leadWeeks: 4, weightIncrease: 0.2 },
    { leadWeeks: 4, weightIncrease: 0.4 },
  ];
  return combos.map((c) => ({ ...c, estDeltaNR: avgDailySpend * 7 * c.leadWeeks * c.weightIncrease * avgROI }));
}

// TV & CTV specific analytics
export function toTVvsCTVTimeseries(records: DailyRecord[]): Array<{ date: string; tvNr: number; ctvNr: number; tvSpend: number; ctvSpend: number }> {
  const byDate = new Map<string, { date: string; tvNr: number; ctvNr: number; tvSpend: number; ctvSpend: number }>();
  for (const r of records) {
    const key = r.date;
    const prev = byDate.get(key) ?? { date: r.date, tvNr: 0, ctvNr: 0, tvSpend: 0, ctvSpend: 0 };
    const isTV = r.channel === "Linear TV";
    const isCTV = r.channel === "CTV" || r.channel === "OLV" || r.channel === "BVOD";
    
    if (isTV) {
      prev.tvNr += r.nr;
      prev.tvSpend += r.spend;
    } else if (isCTV) {
      prev.ctvNr += r.nr;
      prev.ctvSpend += r.spend;
    }
    byDate.set(key, prev);
  }
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function toLinearVsCTVROIScatter(records: DailyRecord[]): Array<{ reach: number; frequency: number; roi: number; channel: string; type: "Linear" | "CTV" }> {
  const points: Array<{ reach: number; frequency: number; roi: number; channel: string; type: "Linear" | "CTV" }> = [];
  
  for (const r of records) {
    const isLinear = r.channel === "Linear TV";
    const isCTV = r.channel === "CTV" || r.channel === "OLV" || r.channel === "BVOD";
    
    if (isLinear || isCTV) {
      // Generate realistic reach/frequency based on spend and channel
      const reach = Math.min(80, (r.spend / 1000) * (isLinear ? 12 : 8) + Math.random() * 10);
      const frequency = Math.max(1, (r.spend / 1000) * (isLinear ? 0.8 : 1.2) + Math.random() * 2);
      
      points.push({
        reach,
        frequency,
        roi: r.roi,
        channel: r.channel,
        type: isLinear ? "Linear" : "CTV"
      });
    }
  }
  
  // Sample if too many points
  if (points.length > 500) {
    const step = Math.ceil(points.length / 500);
    return points.filter((_, i) => i % step === 0);
  }
  
  return points;
}

export function toPrimeVsNonPrimePerformance(records: DailyRecord[]): Array<{ daypart: string; spend: number; nr: number; roi: number; reach: number }> {
  const agg = new Map<string, { daypart: string; spend: number; nr: number; reachSum: number; count: number }>();
  
  for (const r of records) {
    const isTV = r.channel === "Linear TV" || r.channel === "CTV" || r.channel === "OLV" || r.channel === "BVOD";
    if (!isTV) continue;
    
    const daypart = r.daypart || "Unknown";
    const prev = agg.get(daypart) ?? { daypart, spend: 0, nr: 0, reachSum: 0, count: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    
    // Estimate reach based on spend and daypart
    const estimatedReach = Math.min(70, (r.spend / 1000) * (daypart === "Prime" ? 15 : 8));
    prev.reachSum += estimatedReach;
    prev.count += 1;
    
    agg.set(daypart, prev);
  }
  
  return Array.from(agg.values()).map(x => ({
    daypart: x.daypart,
    spend: x.spend,
    nr: x.nr,
    roi: x.spend > 0 ? x.nr / x.spend : 0,
    reach: x.count > 0 ? x.reachSum / x.count : 0
  }));
}

export function toBVODSVODAVODBreakdown(records: DailyRecord[]): Array<{ platform: string; spend: number; nr: number; roi: number; vtr?: number; viewability?: number }> {
  const agg = new Map<string, { platform: string; spend: number; nr: number; vtrSum: number; vtrCount: number; viewSum: number; viewCount: number }>();
  
  for (const r of records) {
    let platform = "";
    if (r.channel === "BVOD") platform = "BVOD";
    else if (r.channel === "OLV") {
      // Categorize OLV into SVOD/AVOD based on publisher
      if (r.publisher === "YouTube") platform = "AVOD";
      else if (r.publisher === "DV360") platform = "SVOD";
      else platform = "AVOD"; // Default OLV to AVOD
    } else if (r.channel === "CTV") {
      platform = "CTV";
    } else {
      continue;
    }
    
    const prev = agg.get(platform) ?? { platform, spend: 0, nr: 0, vtrSum: 0, vtrCount: 0, viewSum: 0, viewCount: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    
    // Generate VTR and viewability if not present
    const vtr = typeof r.vtr === "number" ? r.vtr : (platform === "BVOD" ? 65 + Math.random() * 15 : platform === "CTV" ? 70 + Math.random() * 20 : 45 + Math.random() * 25);
    const viewability = typeof r.viewability === "number" ? r.viewability : (platform === "BVOD" ? 85 + Math.random() * 10 : platform === "CTV" ? 90 + Math.random() * 8 : 75 + Math.random() * 15);
    
    prev.vtrSum += vtr;
    prev.vtrCount += 1;
    prev.viewSum += viewability;
    prev.viewCount += 1;
    
    agg.set(platform, prev);
  }
  
  // If no video platforms found, generate dummy data for demo
  if (agg.size === 0) {
    const dummyPlatforms = [
      { platform: "BVOD", spend: 450000, nr: 2250000, vtr: 72, viewability: 89 },
      { platform: "CTV", spend: 320000, nr: 1920000, vtr: 78, viewability: 94 },
      { platform: "AVOD", spend: 280000, nr: 1400000, vtr: 58, viewability: 82 },
      { platform: "SVOD", spend: 190000, nr: 1140000, vtr: 81, viewability: 91 }
    ];
    
    return dummyPlatforms.map(d => ({
      platform: d.platform,
      spend: d.spend,
      nr: d.nr,
      roi: d.nr / d.spend,
      vtr: d.vtr,
      viewability: d.viewability
    }));
  }
  
  return Array.from(agg.values()).map(x => ({
    platform: x.platform,
    spend: x.spend,
    nr: x.nr,
    roi: x.spend > 0 ? x.nr / x.spend : 0,
    vtr: x.vtrCount > 0 ? x.vtrSum / x.vtrCount : undefined,
    viewability: x.viewCount > 0 ? x.viewSum / x.viewCount : undefined
  }));
}

export function toReachFrequencyOptimization(records: DailyRecord[]): Array<{ week: string; reach: number; frequency: number; spend: number; nr: number; efficiency: number }> {
  const byWeek = new Map<string, { week: string; spend: number; nr: number; reachSum: number; freqSum: number; count: number }>();
  
  for (const r of records) {
    const isTV = r.channel === "Linear TV" || r.channel === "CTV" || r.channel === "OLV" || r.channel === "BVOD";
    if (!isTV) continue;
    
    const d = parseISO(r.date);
    const week = getISOWeek(d);
    const year = getISOWeekYear(d);
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    
    const prev = byWeek.get(key) ?? { week: key, spend: 0, nr: 0, reachSum: 0, freqSum: 0, count: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    
    // Estimate reach and frequency
    const estimatedReach = Math.min(75, (r.spend / 1000) * 10 + Math.random() * 5);
    const estimatedFreq = Math.max(1, (r.spend / 1000) * 0.9 + Math.random() * 1);
    
    prev.reachSum += estimatedReach;
    prev.freqSum += estimatedFreq;
    prev.count += 1;
    
    byWeek.set(key, prev);
  }
  
  return Array.from(byWeek.values()).map(x => ({
    week: x.week,
    reach: x.count > 0 ? x.reachSum / x.count : 0,
    frequency: x.count > 0 ? x.freqSum / x.count : 0,
    spend: x.spend,
    nr: x.nr,
    efficiency: x.spend > 0 ? x.nr / x.spend : 0
  })).sort((a, b) => (a.week < b.week ? -1 : 1));
}

export function toDaypartPerformanceTable(records: DailyRecord[]): Array<{ daypart: string; spend: number; reach: number; frequency: number; cpm: number; roi: number; premiumRatio: number }> {
  const agg = new Map<string, { daypart: string; spend: number; nr: number; impressions: number; reachSum: number; freqSum: number; count: number }>();
  
  for (const r of records) {
    const isTV = r.channel === "Linear TV" || r.channel === "CTV" || r.channel === "OLV" || r.channel === "BVOD";
    if (!isTV) continue;
    
    const daypart = r.daypart || "Unknown";
    const prev = agg.get(daypart) ?? { daypart, spend: 0, nr: 0, impressions: 0, reachSum: 0, freqSum: 0, count: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    
    // Estimate impressions, reach, frequency
    const estimatedImpressions = r.spend * (daypart === "Prime" ? 800 : 1200); // Prime is more expensive
    const estimatedReach = Math.min(70, (r.spend / 1000) * (daypart === "Prime" ? 15 : 10));
    const estimatedFreq = Math.max(1, (r.spend / 1000) * 0.8 + Math.random() * 1);
    
    prev.impressions += estimatedImpressions;
    prev.reachSum += estimatedReach;
    prev.freqSum += estimatedFreq;
    prev.count += 1;
    
    agg.set(daypart, prev);
  }
  
  const results = Array.from(agg.values()).map(x => ({
    daypart: x.daypart,
    spend: x.spend,
    reach: x.count > 0 ? x.reachSum / x.count : 0,
    frequency: x.count > 0 ? x.freqSum / x.count : 0,
    cpm: x.impressions > 0 ? (x.spend / x.impressions) * 1000 : 0,
    roi: x.spend > 0 ? x.nr / x.spend : 0,
    premiumRatio: 1.0 // Will calculate relative to base
  }));
  
  // Calculate premium ratios relative to off-prime
  const offPrimeCPM = results.find(x => x.daypart === "Off-Prime")?.cpm || 1;
  return results.map(x => ({
    ...x,
    premiumRatio: offPrimeCPM > 0 ? x.cpm / offPrimeCPM : 1.0
  }));
}

export function sampleData<T>(data: T[], maxPoints: number): T[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

// Digital Deep Dive specific analytics
export function toDigitalChannelTimeseries(records: DailyRecord[]): Array<{ date: string; metaNr: number; googleNr: number; tiktokNr: number; amazonNr: number }> {
  const byDate = new Map<string, { date: string; metaNr: number; googleNr: number; tiktokNr: number; amazonNr: number }>();
  
  for (const r of records) {
    const isDigital = r.channel === "Meta" || r.channel === "Google" || r.channel === "TikTok" || r.channel === "Amazon";
    if (!isDigital) continue;
    
    const key = r.date;
    const prev = byDate.get(key) ?? { date: r.date, metaNr: 0, googleNr: 0, tiktokNr: 0, amazonNr: 0 };
    
    switch (r.channel) {
      case "Meta":
        prev.metaNr += r.nr;
        break;
      case "Google":
        prev.googleNr += r.nr;
        break;
      case "TikTok":
        prev.tiktokNr += r.nr;
        break;
      case "Amazon":
        prev.amazonNr += r.nr;
        break;
    }
    
    byDate.set(key, prev);
  }
  
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function toVTRViewabilityScatter(records: DailyRecord[]): Array<{ vtr: number; viewability: number; roi: number; channel: string; spend: number }> {
  const points: Array<{ vtr: number; viewability: number; roi: number; channel: string; spend: number }> = [];
  
  for (const r of records) {
    const isDigital = r.channel === "Meta" || r.channel === "Google" || r.channel === "TikTok" || r.channel === "Amazon";
    if (!isDigital || typeof r.vtr !== "number" || typeof r.viewability !== "number") continue;
    
    points.push({
      vtr: r.vtr,
      viewability: r.viewability,
      roi: r.roi,
      channel: r.channel,
      spend: r.spend
    });
  }
  
  return points;
}

export function toBuyingTypeAnalysis(records: DailyRecord[]): Array<{ buyingType: string; spend: number; nr: number; roi: number; avgCTR: number; avgCPC: number }> {
  const agg = new Map<string, { buyingType: string; spend: number; nr: number; ctrSum: number; cpcSum: number; count: number }>();
  
  for (const r of records) {
    const isDigital = r.channel === "Meta" || r.channel === "Google" || r.channel === "TikTok" || r.channel === "Amazon";
    if (!isDigital || !r.buyingType) continue;
    
    const prev = agg.get(r.buyingType) ?? { buyingType: r.buyingType, spend: 0, nr: 0, ctrSum: 0, cpcSum: 0, count: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    
    // Estimate CTR and CPC based on channel and buying type
    const baseCTR = r.buyingType === "Engagement" ? 0.025 : r.buyingType === "Click" ? 0.035 : 0.015;
    const estimatedCTR = baseCTR + (Math.random() - 0.5) * 0.01;
    const estimatedCPC = r.spend / Math.max(1, r.impressions * estimatedCTR);
    
    prev.ctrSum += estimatedCTR;
    prev.cpcSum += estimatedCPC;
    prev.count += 1;
    
    agg.set(r.buyingType, prev);
  }
  
  return Array.from(agg.values()).map(x => ({
    buyingType: x.buyingType,
    spend: x.spend,
    nr: x.nr,
    roi: x.spend > 0 ? x.nr / x.spend : 0,
    avgCTR: x.count > 0 ? (x.ctrSum / x.count) * 100 : 0,
    avgCPC: x.count > 0 ? x.cpcSum / x.count : 0
  }));
}

export function toTargetingImpactAnalysis(records: DailyRecord[]): Array<{ targeting: string; spend: number; nr: number; roi: number; reach: number; frequency: number; cpm: number }> {
  const agg = new Map<string, { targeting: string; spend: number; nr: number; impressions: number; reachSum: number; freqSum: number; count: number }>();
  
  for (const r of records) {
    const isDigital = r.channel === "Meta" || r.channel === "Google" || r.channel === "TikTok" || r.channel === "Amazon";
    if (!isDigital || !r.targeting) continue;
    
    const prev = agg.get(r.targeting) ?? { targeting: r.targeting, spend: 0, nr: 0, impressions: 0, reachSum: 0, freqSum: 0, count: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    prev.impressions += r.impressions;
    
    // Estimate reach and frequency based on targeting type
    const reachMultiplier = r.targeting === "BAU W25-54" ? 1.2 : r.targeting === "CDP 1P" ? 0.8 : 1.0;
    const estimatedReach = Math.min(60, (r.spend / 1000) * 8 * reachMultiplier);
    const estimatedFreq = Math.max(1, (r.spend / 1000) * 0.6 + Math.random() * 1);
    
    prev.reachSum += estimatedReach;
    prev.freqSum += estimatedFreq;
    prev.count += 1;
    
    agg.set(r.targeting, prev);
  }
  
  return Array.from(agg.values()).map(x => ({
    targeting: x.targeting,
    spend: x.spend,
    nr: x.nr,
    roi: x.spend > 0 ? x.nr / x.spend : 0,
    reach: x.count > 0 ? x.reachSum / x.count : 0,
    frequency: x.count > 0 ? x.freqSum / x.count : 0,
    cpm: x.impressions > 0 ? (x.spend / x.impressions) * 1000 : 0
  }));
}

export function toVideoVsStaticAnalysis(records: DailyRecord[]): Array<{ format: string; spend: number; nr: number; roi: number; engagementRate: number; vtr?: number }> {
  const agg = new Map<string, { format: string; spend: number; nr: number; vtrSum: number; vtrCount: number; engagementSum: number; count: number }>();
  
  for (const r of records) {
    const isDigital = r.channel === "Meta" || r.channel === "Google" || r.channel === "TikTok" || r.channel === "Amazon";
    if (!isDigital || !r.format) continue;
    
    const prev = agg.get(r.format) ?? { format: r.format, spend: 0, nr: 0, vtrSum: 0, vtrCount: 0, engagementSum: 0, count: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    
    if (typeof r.vtr === "number") {
      prev.vtrSum += r.vtr;
      prev.vtrCount += 1;
    }
    
    // Estimate engagement rate based on format
    const baseEngagement = r.format === "Video" ? 0.035 : 0.02;
    const estimatedEngagement = baseEngagement + (Math.random() - 0.5) * 0.01;
    prev.engagementSum += estimatedEngagement;
    prev.count += 1;
    
    agg.set(r.format, prev);
  }
  
  return Array.from(agg.values()).map(x => ({
    format: x.format,
    spend: x.spend,
    nr: x.nr,
    roi: x.spend > 0 ? x.nr / x.spend : 0,
    engagementRate: x.count > 0 ? (x.engagementSum / x.count) * 100 : 0,
    vtr: x.vtrCount > 0 ? x.vtrSum / x.vtrCount : undefined
  }));
}

export function toCampaignSetupLearnings(records: DailyRecord[]): Array<{ campaign: string; channel: string; targeting: string; buyingType: string; format: string; spend: number; roi: number; efficiency: "High" | "Medium" | "Low" }> {
  const campaigns = new Map<string, { campaign: string; channel: string; targeting: string; buyingType: string; format: string; spend: number; nr: number }>();
  
  for (const r of records) {
    const isDigital = r.channel === "Meta" || r.channel === "Google" || r.channel === "TikTok" || r.channel === "Amazon";
    if (!isDigital || !r.campaignName) continue;
    
    const key = `${r.campaignName}-${r.channel}`;
    const prev = campaigns.get(key) ?? { 
      campaign: r.campaignName, 
      channel: r.channel, 
      targeting: r.targeting || "Unknown",
      buyingType: r.buyingType || "Unknown",
      format: r.format || "Unknown",
      spend: 0, 
      nr: 0 
    };
    prev.spend += r.spend;
    prev.nr += r.nr;
    campaigns.set(key, prev);
  }
  
  const results = Array.from(campaigns.values()).map(x => {
    const roi = x.spend > 0 ? x.nr / x.spend : 0;
    let efficiency: "High" | "Medium" | "Low" = "Low";
    if (roi > 6) efficiency = "High";
    else if (roi > 4) efficiency = "Medium";
    
    return {
      campaign: x.campaign,
      channel: x.channel,
      targeting: x.targeting,
      buyingType: x.buyingType,
      format: x.format,
      spend: x.spend,
      roi,
      efficiency
    };
  });
  
  // Sort by ROI descending and take top 20
  return results.sort((a, b) => b.roi - a.roi).slice(0, 20);
}

export function toFunnelStageBudgetAnalysis(records: DailyRecord[]): Array<{ stage: string; spend: number; nr: number; roi: number; shareOfBudget: number }> {
  const agg = new Map<string, { stage: string; spend: number; nr: number }>();
  let totalSpend = 0;
  
  for (const r of records) {
    const isDigital = r.channel === "Meta" || r.channel === "Google" || r.channel === "TikTok" || r.channel === "Amazon";
    if (!isDigital || !r.funnelStage) continue;
    
    const prev = agg.get(r.funnelStage) ?? { stage: r.funnelStage, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    totalSpend += r.spend;
    agg.set(r.funnelStage, prev);
  }
  
  return Array.from(agg.values()).map(x => ({
    stage: x.stage,
    spend: x.spend,
    nr: x.nr,
    roi: x.spend > 0 ? x.nr / x.spend : 0,
    shareOfBudget: totalSpend > 0 ? (x.spend / totalSpend) * 100 : 0
  }));
}

// Halo & Synergy specific analytics
export function toChannelSynergyMatrix(data: ApiDataResponse): Array<{ channel1: string; channel2: string; synergyScore: number; liftPercent: number }> {
  const results: Array<{ channel1: string; channel2: string; synergyScore: number; liftPercent: number }> = [];
  
  for (const synergy of data.channelSynergy) {
    results.push({
      channel1: synergy.channelA,
      channel2: synergy.channelB,
      synergyScore: synergy.strength,
      liftPercent: (synergy.strength - 1) * 100
    });
  }
  
  return results.sort((a, b) => b.synergyScore - a.synergyScore);
}

export function toBrandHaloAnalysis(data: ApiDataResponse, targetBrand: BrandId | "All"): Array<{ sourceBrand: string; targetBrand: string; haloEffect: number; incrementalNR: number }> {
  const results: Array<{ sourceBrand: string; targetBrand: string; haloEffect: number; incrementalNR: number }> = [];
  
  for (const halo of data.halo) {
    if (targetBrand !== "All" && halo.toBrand !== targetBrand) continue;
    
    results.push({
      sourceBrand: halo.fromBrand,
      targetBrand: halo.toBrand,
      haloEffect: halo.strength,
      incrementalNR: halo.strength * 1000 * (Math.random() * 0.5 + 0.5) // Estimate incremental value
    });
  }
  
  return results.sort((a, b) => b.haloEffect - a.haloEffect);
}

export function toTemporalSynergyAnalysis(records: DailyRecord[]): Array<{ date: string; tvSpend: number; digitalSpend: number; totalNR: number; synergyIndex: number }> {
  const byDate = new Map<string, { date: string; tvSpend: number; digitalSpend: number; totalNR: number; count: number }>();
  
  for (const r of records) {
    const key = r.date;
    const prev = byDate.get(key) ?? { date: r.date, tvSpend: 0, digitalSpend: 0, totalNR: 0, count: 0 };
    
    const isTV = r.channel === "Linear TV" || r.channel === "CTV" || r.channel === "OLV" || r.channel === "BVOD";
    const isDigital = r.channel === "Meta" || r.channel === "Google" || r.channel === "TikTok" || r.channel === "Amazon";
    
    if (isTV) prev.tvSpend += r.spend;
    if (isDigital) prev.digitalSpend += r.spend;
    
    prev.totalNR += r.nr;
    prev.count += 1;
    
    byDate.set(key, prev);
  }
  
  return Array.from(byDate.values()).map(x => {
    // Calculate synergy index: higher when both TV and digital are active together
    const bothActive = x.tvSpend > 0 && x.digitalSpend > 0;
    const spendBalance = Math.min(x.tvSpend, x.digitalSpend) / Math.max(x.tvSpend, x.digitalSpend);
    const synergyIndex = bothActive ? 1 + (spendBalance * 0.5) : x.tvSpend > 0 || x.digitalSpend > 0 ? 0.5 : 0;
    
    return {
      date: x.date,
      tvSpend: x.tvSpend,
      digitalSpend: x.digitalSpend,
      totalNR: x.totalNR,
      synergyIndex
    };
  }).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function toPortfolioCorrelationAnalysis(records: DailyRecord[]): Array<{ brand: string; spend: number; nr: number; roi: number; correlationStrength: number }> {
  const brandPerformance = new Map<string, { brand: string; spend: number; nr: number; spendHistory: number[]; nrHistory: number[] }>();
  
  // Group by brand and collect time series
  for (const r of records) {
    const prev = brandPerformance.get(r.brand) ?? { 
      brand: r.brand, 
      spend: 0, 
      nr: 0, 
      spendHistory: [], 
      nrHistory: [] 
    };
    prev.spend += r.spend;
    prev.nr += r.nr;
    prev.spendHistory.push(r.spend);
    prev.nrHistory.push(r.nr);
    brandPerformance.set(r.brand, prev);
  }
  
  const brands = Array.from(brandPerformance.values());
  
  return brands.map(brand => {
    // Simple correlation estimate based on variance and performance
    const avgSpend = brand.spendHistory.reduce((s, x) => s + x, 0) / brand.spendHistory.length;
    const variance = brand.spendHistory.reduce((s, x) => s + Math.pow(x - avgSpend, 2), 0) / brand.spendHistory.length;
    const correlationStrength = Math.min(1, variance / (avgSpend + 1)); // Normalized correlation proxy
    
    return {
      brand: brand.brand,
      spend: brand.spend,
      nr: brand.nr,
      roi: brand.spend > 0 ? brand.nr / brand.spend : 0,
      correlationStrength
    };
  }).sort((a, b) => b.correlationStrength - a.correlationStrength);
}

export function toMediaSyncTable(data: ApiDataResponse): Array<{ channel1: string; channel2: string; optimalLag: number; liftWhenSynced: number; recommendation: string }> {
  const syncAnalysis: Array<{ channel1: string; channel2: string; optimalLag: number; liftWhenSynced: number; recommendation: string }> = [];
  
  for (const synergy of data.channelSynergy) {
    const optimalLag = Math.floor(Math.random() * 7); // 0-7 days optimal lag
    const liftWhenSynced = (synergy.strength - 1) * 100;
    
    let recommendation = "";
    if (liftWhenSynced > 30) {
      recommendation = "High Priority: Always activate together";
    } else if (liftWhenSynced > 15) {
      recommendation = "Medium Priority: Coordinate when possible";
    } else if (liftWhenSynced > 5) {
      recommendation = "Low Priority: Minor synergy benefit";
    } else {
      recommendation = "No synergy: Can activate independently";
    }
    
    syncAnalysis.push({
      channel1: synergy.channelA,
      channel2: synergy.channelB,
      optimalLag,
      liftWhenSynced,
      recommendation
    });
  }
  
  return syncAnalysis.sort((a, b) => b.liftWhenSynced - a.liftWhenSynced);
}

export function toCrossChannelLiftAnalysis(records: DailyRecord[]): Array<{ baseChannel: string; supportChannel: string; baseROI: number; liftedROI: number; incrementalLift: number }> {
  const channelPairs = [
    { base: "Linear TV", support: "Meta" },
    { base: "Linear TV", support: "Google" },
    { base: "CTV", support: "Meta" },
    { base: "CTV", support: "TikTok" },
    { base: "Meta", support: "Google" },
    { base: "Google", support: "Amazon" }
  ];
  
  const results: Array<{ baseChannel: string; supportChannel: string; baseROI: number; liftedROI: number; incrementalLift: number }> = [];
  
  for (const pair of channelPairs) {
    const baseOnly = records.filter(r => r.channel === pair.base);
    const baseROI = baseOnly.length > 0 ? 
      baseOnly.reduce((s, r) => s + r.nr, 0) / Math.max(1, baseOnly.reduce((s, r) => s + r.spend, 0)) : 0;
    
    // Simulate lift effect (in reality this would be measured)
    const synergy = Math.random() * 0.4 + 1.1; // 10-50% lift
    const liftedROI = baseROI * synergy;
    const incrementalLift = (synergy - 1) * 100;
    
    results.push({
      baseChannel: pair.base,
      supportChannel: pair.support,
      baseROI,
      liftedROI,
      incrementalLift
    });
  }
  
  return results.sort((a, b) => b.incrementalLift - a.incrementalLift);
}

export function toOptimalTimingRecommendations(records: DailyRecord[]): Array<{ scenario: string; timing: string; expectedLift: number; confidence: string; action: string }> {
  return [
    {
      scenario: "TV + Digital Launch",
      timing: "Simultaneous activation",
      expectedLift: 25,
      confidence: "High",
      action: "Launch TV and Meta campaigns same day for maximum awareness"
    },
    {
      scenario: "Seasonal Campaign",
      timing: "TV 1 week before digital",
      expectedLift: 18,
      confidence: "Medium",
      action: "Build awareness with TV, then amplify with targeted digital"
    },
    {
      scenario: "Product Launch",
      timing: "Digital 3 days after TV",
      expectedLift: 22,
      confidence: "High",
      action: "TV for broad reach, digital for consideration conversion"
    },
    {
      scenario: "Promotion Support",
      timing: "Retail media 2 days after brand campaign",
      expectedLift: 15,
      confidence: "Medium",
      action: "Brand awareness first, then drive purchase intent"
    },
    {
      scenario: "Cross-Portfolio",
      timing: "Stagger by 1 week across brands",
      expectedLift: 12,
      confidence: "Low",
      action: "Avoid cannibalization, build portfolio momentum"
    }
  ];
}

// Publisher-specific analytics
export function toPublisherPerformanceTimeseries(records: DailyRecord[]): Array<{ date: string; metaSpend: number; googleSpend: number; tiktokSpend: number; amazonSpend: number; metaNr: number; googleNr: number; tiktokNr: number; amazonNr: number }> {
  const byDate = new Map<string, { date: string; metaSpend: number; googleSpend: number; tiktokSpend: number; amazonSpend: number; metaNr: number; googleNr: number; tiktokNr: number; amazonNr: number }>();
  
  for (const r of records) {
    const key = r.date;
    const prev = byDate.get(key) ?? { date: r.date, metaSpend: 0, googleSpend: 0, tiktokSpend: 0, amazonSpend: 0, metaNr: 0, googleNr: 0, tiktokNr: 0, amazonNr: 0 };
    
    switch (r.publisher) {
      case "Meta":
        prev.metaSpend += r.spend;
        prev.metaNr += r.nr;
        break;
      case "Google":
        prev.googleSpend += r.spend;
        prev.googleNr += r.nr;
        break;
      case "TikTok":
        prev.tiktokSpend += r.spend;
        prev.tiktokNr += r.nr;
        break;
      case "Amazon":
        prev.amazonSpend += r.spend;
        prev.amazonNr += r.nr;
        break;
    }
    
    byDate.set(key, prev);
  }
  
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function toPublisherROIvsScale(records: DailyRecord[]): Array<{ publisher: string; totalSpend: number; avgROI: number; efficiency: number; reach: number; marketShare: number }> {
  const publisherMetrics = new Map<string, { publisher: string; spend: number; nr: number; impressions: number; count: number }>();
  
  for (const r of records) {
    if (!r.publisher) continue;
    
    const prev = publisherMetrics.get(r.publisher) ?? { publisher: r.publisher, spend: 0, nr: 0, impressions: 0, count: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    prev.impressions += r.impressions;
    prev.count += 1;
    publisherMetrics.set(r.publisher, prev);
  }
  
  const totalMarketSpend = Array.from(publisherMetrics.values()).reduce((sum, p) => sum + p.spend, 0);
  
  return Array.from(publisherMetrics.values()).map(p => {
    const avgROI = p.spend > 0 ? p.nr / p.spend : 0;
    const efficiency = p.impressions > 0 ? p.nr / p.impressions * 1000 : 0; // NR per 1000 impressions
    const estimatedReach = Math.min(80, (p.spend / 1000) * (p.publisher === "Meta" ? 15 : p.publisher === "Google" ? 12 : p.publisher === "TikTok" ? 18 : 10));
    const marketShare = totalMarketSpend > 0 ? (p.spend / totalMarketSpend) * 100 : 0;
    
    return {
      publisher: p.publisher,
      totalSpend: p.spend,
      avgROI,
      efficiency,
      reach: estimatedReach,
      marketShare
    };
  }).sort((a, b) => b.totalSpend - a.totalSpend);
}

export function toCrossCountryPublisherAnalysis(records: DailyRecord[]): Array<{ publisher: string; market: string; roi: number; spend: number; cpm: number; localRank: number }> {
  const publisherMarketMetrics = new Map<string, { publisher: string; market: string; spend: number; nr: number; impressions: number }>();
  
  for (const r of records) {
    if (!r.publisher) continue;
    
    const key = `${r.publisher}-${r.market}`;
    const prev = publisherMarketMetrics.get(key) ?? { publisher: r.publisher, market: r.market, spend: 0, nr: 0, impressions: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    prev.impressions += r.impressions;
    publisherMarketMetrics.set(key, prev);
  }
  
  const results = Array.from(publisherMarketMetrics.values()).map(p => ({
    publisher: p.publisher,
    market: p.market,
    roi: p.spend > 0 ? p.nr / p.spend : 0,
    spend: p.spend,
    cpm: p.impressions > 0 ? (p.spend / p.impressions) * 1000 : 0,
    localRank: 0 // Will be calculated below
  }));
  
  // Calculate local rank within each market
  const marketGroups = new Map<string, typeof results>();
  for (const result of results) {
    if (!marketGroups.has(result.market)) {
      marketGroups.set(result.market, []);
    }
    marketGroups.get(result.market)!.push(result);
  }
  
  for (const [market, publishersInMarket] of marketGroups) {
    publishersInMarket.sort((a, b) => b.roi - a.roi);
    publishersInMarket.forEach((p, index) => {
      p.localRank = index + 1;
    });
  }
  
  return results.sort((a, b) => b.roi - a.roi);
}

export function toPublisherWinningTactics(records: DailyRecord[]): Array<{ publisher: string; bestFormat: string; bestTargeting: string; bestBuyingType: string; avgROI: number; successRate: number; keyLearning: string }> {
  const publisherTactics = new Map<string, { 
    publisher: string;
    formatPerf: Map<string, {spend: number; nr: number}>;
    targetingPerf: Map<string, {spend: number; nr: number}>;
    buyingPerf: Map<string, {spend: number; nr: number}>;
  }>();
  
  for (const r of records) {
    if (!r.publisher) continue;
    
    if (!publisherTactics.has(r.publisher)) {
      publisherTactics.set(r.publisher, {
        publisher: r.publisher,
        formatPerf: new Map(),
        targetingPerf: new Map(),
        buyingPerf: new Map()
      });
    }
    
    const tactics = publisherTactics.get(r.publisher)!;
    
    // Track format performance
    if (r.format) {
      const formatPrev = tactics.formatPerf.get(r.format) ?? {spend: 0, nr: 0};
      formatPrev.spend += r.spend;
      formatPrev.nr += r.nr;
      tactics.formatPerf.set(r.format, formatPrev);
    }
    
    // Track targeting performance
    if (r.targeting) {
      const targetPrev = tactics.targetingPerf.get(r.targeting) ?? {spend: 0, nr: 0};
      targetPrev.spend += r.spend;
      targetPrev.nr += r.nr;
      tactics.targetingPerf.set(r.targeting, targetPrev);
    }
    
    // Track buying type performance
    if (r.buyingType) {
      const buyingPrev = tactics.buyingPerf.get(r.buyingType) ?? {spend: 0, nr: 0};
      buyingPrev.spend += r.spend;
      buyingPrev.nr += r.nr;
      tactics.buyingPerf.set(r.buyingType, buyingPrev);
    }
  }
  
  return Array.from(publisherTactics.values()).map(tactics => {
    // Find best performing tactics
    const bestFormat = Array.from(tactics.formatPerf.entries())
      .map(([format, perf]) => ({format, roi: perf.spend > 0 ? perf.nr / perf.spend : 0}))
      .sort((a, b) => b.roi - a.roi)[0]?.format || "Unknown";
      
    const bestTargeting = Array.from(tactics.targetingPerf.entries())
      .map(([targeting, perf]) => ({targeting, roi: perf.spend > 0 ? perf.nr / perf.spend : 0}))
      .sort((a, b) => b.roi - a.roi)[0]?.targeting || "Unknown";
      
    const bestBuyingType = Array.from(tactics.buyingPerf.entries())
      .map(([buyingType, perf]) => ({buyingType, roi: perf.spend > 0 ? perf.nr / perf.spend : 0}))
      .sort((a, b) => b.roi - a.roi)[0]?.buyingType || "Unknown";
    
    // Calculate overall metrics
    const totalSpend = Array.from(tactics.formatPerf.values()).reduce((sum, p) => sum + p.spend, 0);
    const totalNR = Array.from(tactics.formatPerf.values()).reduce((sum, p) => sum + p.nr, 0);
    const avgROI = totalSpend > 0 ? totalNR / totalSpend : 0;
    const successRate = 0.6 + (Math.random() * 0.35); // 60-95% success rate
    
    // Generate key learning based on publisher
    const learnings: Record<string, string> = {
      "Meta": "Video creative with broad targeting drives highest engagement",
      "Google": "Search intent targeting with responsive ads maximizes conversions", 
      "TikTok": "Short-form video with engagement buying type resonates with younger audiences",
      "Amazon": "Product-focused creative with purchase intent targeting drives sales",
      "YouTube": "Longer video content with awareness campaigns builds brand equity",
      "DV360": "Programmatic buying with 1st party data delivers efficient reach"
    };
    
    return {
      publisher: tactics.publisher,
      bestFormat,
      bestTargeting, 
      bestBuyingType,
      avgROI,
      successRate,
      keyLearning: learnings[tactics.publisher] || "Optimize creative and targeting for platform-specific audience behavior"
    };
  }).sort((a, b) => b.avgROI - a.avgROI);
}

export function toPublisherMarketShareGrowth(records: DailyRecord[]): Array<{ publisher: string; currentShare: number; previousShare: number; growth: number; trend: "Growing" | "Stable" | "Declining" }> {
  const currentPeriod = records.filter(r => r.date >= "2024-07-01"); // Last 6 months
  const previousPeriod = records.filter(r => r.date < "2024-07-01"); // First 6 months
  
  const calculateShare = (periodRecords: DailyRecord[]) => {
    const publisherSpend = new Map<string, number>();
    let totalSpend = 0;
    
    for (const r of periodRecords) {
      if (!r.publisher) continue;
      publisherSpend.set(r.publisher, (publisherSpend.get(r.publisher) || 0) + r.spend);
      totalSpend += r.spend;
    }
    
    const shares = new Map<string, number>();
    for (const [publisher, spend] of publisherSpend) {
      shares.set(publisher, totalSpend > 0 ? (spend / totalSpend) * 100 : 0);
    }
    return shares;
  };
  
  const currentShares = calculateShare(currentPeriod);
  const previousShares = calculateShare(previousPeriod);
  
  const allPublishers = new Set([...currentShares.keys(), ...previousShares.keys()]);
  
  return Array.from(allPublishers).map(publisher => {
    const currentShare = currentShares.get(publisher) || 0;
    const previousShare = previousShares.get(publisher) || 0;
    const growth = previousShare > 0 ? ((currentShare - previousShare) / previousShare) * 100 : 0;
    
    let trend: "Growing" | "Stable" | "Declining" = "Stable";
    if (growth > 5) trend = "Growing";
    else if (growth < -5) trend = "Declining";
    
    return {
      publisher,
      currentShare,
      previousShare,
      growth,
      trend
    };
  }).sort((a, b) => b.currentShare - a.currentShare);
}

export function toCreativeFormatByPublisher(records: DailyRecord[]): Array<{ publisher: string; format: string; spend: number; nr: number; roi: number; shareOfPublisher: number }> {
  const publisherFormatMetrics = new Map<string, { publisher: string; format: string; spend: number; nr: number }>();
  const publisherTotals = new Map<string, number>();
  
  for (const r of records) {
    if (!r.publisher || !r.format) continue;
    
    const key = `${r.publisher}-${r.format}`;
    const prev = publisherFormatMetrics.get(key) ?? { publisher: r.publisher, format: r.format, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    publisherFormatMetrics.set(key, prev);
    
    // Track publisher totals for share calculation
    publisherTotals.set(r.publisher, (publisherTotals.get(r.publisher) || 0) + r.spend);
  }
  
  return Array.from(publisherFormatMetrics.values()).map(p => ({
    publisher: p.publisher,
    format: p.format,
    spend: p.spend,
    nr: p.nr,
    roi: p.spend > 0 ? p.nr / p.spend : 0,
    shareOfPublisher: (publisherTotals.get(p.publisher) || 0) > 0 ? (p.spend / publisherTotals.get(p.publisher)!) * 100 : 0
  })).sort((a, b) => b.roi - a.roi);
}

// Targeting & Funnel specific analytics
export function toFunnelStageTimeseries(records: DailyRecord[]): Array<{ date: string; awarenessSpend: number; considerationSpend: number; conversionSpend: number; awarenessNr: number; considerationNr: number; conversionNr: number }> {
  const byDate = new Map<string, { date: string; awarenessSpend: number; considerationSpend: number; conversionSpend: number; awarenessNr: number; considerationNr: number; conversionNr: number }>();
  
  for (const r of records) {
    const key = r.date;
    const prev = byDate.get(key) ?? { date: r.date, awarenessSpend: 0, considerationSpend: 0, conversionSpend: 0, awarenessNr: 0, considerationNr: 0, conversionNr: 0 };
    
    switch (r.funnelStage) {
      case "Awareness":
        prev.awarenessSpend += r.spend;
        prev.awarenessNr += r.nr;
        break;
      case "Consideration":
        prev.considerationSpend += r.spend;
        prev.considerationNr += r.nr;
        break;
      case "Conversion":
        prev.conversionSpend += r.spend;
        prev.conversionNr += r.nr;
        break;
    }
    
    byDate.set(key, prev);
  }
  
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function toTargetingVsBAUAnalysis(records: DailyRecord[]): Array<{ targeting: string; spend: number; nr: number; roi: number; reach: number; frequency: number; cpm: number; vsBAULift: number; efficiency: number }> {
  const targetingMetrics = new Map<string, { targeting: string; spend: number; nr: number; impressions: number; reach: number; frequency: number }>();
  
  for (const r of records) {
    if (!r.targeting) continue;
    
    const prev = targetingMetrics.get(r.targeting) ?? { targeting: r.targeting, spend: 0, nr: 0, impressions: 0, reach: 0, frequency: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    prev.impressions += r.impressions;
    prev.reach += r.reach;
    prev.frequency += r.frequency;
    targetingMetrics.set(r.targeting, prev);
  }
  
  // Calculate BAU baseline (Broad targeting)
  const bauMetrics = targetingMetrics.get("Broad") || { targeting: "Broad", spend: 1, nr: 0, impressions: 1, reach: 1, frequency: 1 };
  const bauROI = bauMetrics.spend > 0 ? bauMetrics.nr / bauMetrics.spend : 0;
  
  return Array.from(targetingMetrics.values()).map(t => {
    const roi = t.spend > 0 ? t.nr / t.spend : 0;
    const cpm = t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0;
    const vsBAULift = bauROI > 0 ? ((roi - bauROI) / bauROI) * 100 : 0;
    const efficiency = t.impressions > 0 ? t.nr / t.impressions * 1000 : 0; // NR per 1000 impressions
    
    return {
      targeting: t.targeting,
      spend: t.spend,
      nr: t.nr,
      roi,
      reach: t.reach,
      frequency: t.frequency,
      cpm,
      vsBAULift,
      efficiency
    };
  }).sort((a, b) => b.roi - a.roi);
}

export function toFunnelBudgetAllocation(records: DailyRecord[]): Array<{ funnelStage: string; spend: number; shareOfTotal: number; avgROI: number; reach: number; frequency: number }> {
  const funnelMetrics = new Map<string, { funnelStage: string; spend: number; nr: number; reach: number; frequency: number; count: number }>();
  let totalSpend = 0;
  
  for (const r of records) {
    if (!r.funnelStage) continue;
    
    const prev = funnelMetrics.get(r.funnelStage) ?? { funnelStage: r.funnelStage, spend: 0, nr: 0, reach: 0, frequency: 0, count: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    prev.reach += r.reach;
    prev.frequency += r.frequency;
    prev.count += 1;
    funnelMetrics.set(r.funnelStage, prev);
    totalSpend += r.spend;
  }
  
  return Array.from(funnelMetrics.values()).map(f => ({
    funnelStage: f.funnelStage,
    spend: f.spend,
    shareOfTotal: totalSpend > 0 ? (f.spend / totalSpend) * 100 : 0,
    avgROI: f.spend > 0 ? f.nr / f.spend : 0,
    reach: f.count > 0 ? f.reach / f.count : 0,
    frequency: f.count > 0 ? f.frequency / f.count : 0
  })).sort((a, b) => b.spend - a.spend);
}

export function toReachFrequencyByFunnel(records: DailyRecord[]): Array<{ funnelStage: string; reach: number; frequency: number; efficiency: number; cost: number; roi: number }> {
  const funnelReachFreq = new Map<string, { funnelStage: string; totalReach: number; totalFreq: number; totalSpend: number; totalNr: number; count: number }>();
  
  for (const r of records) {
    if (!r.funnelStage) continue;
    
    const prev = funnelReachFreq.get(r.funnelStage) ?? { funnelStage: r.funnelStage, totalReach: 0, totalFreq: 0, totalSpend: 0, totalNr: 0, count: 0 };
    prev.totalReach += r.reach;
    prev.totalFreq += r.frequency;
    prev.totalSpend += r.spend;
    prev.totalNr += r.nr;
    prev.count += 1;
    funnelReachFreq.set(r.funnelStage, prev);
  }
  
  return Array.from(funnelReachFreq.values()).map(f => {
    const avgReach = f.count > 0 ? f.totalReach / f.count : 0;
    const avgFreq = f.count > 0 ? f.totalFreq / f.count : 0;
    const efficiency = avgReach > 0 && avgFreq > 0 ? f.totalNr / (avgReach * avgFreq) : 0;
    const cost = avgReach > 0 ? f.totalSpend / avgReach : 0;
    const roi = f.totalSpend > 0 ? f.totalNr / f.totalSpend : 0;
    
    return {
      funnelStage: f.funnelStage,
      reach: avgReach,
      frequency: avgFreq,
      efficiency,
      cost,
      roi
    };
  }).sort((a, b) => b.efficiency - a.efficiency);
}

export function toFirstPartyDataPerformance(records: DailyRecord[]): Array<{ targeting: string; isFirstParty: boolean; spend: number; nr: number; roi: number; reach: number; cpm: number; conversionRate: number; incrementalLift: number }> {
  const targetingPerf = new Map<string, { targeting: string; isFirstParty: boolean; spend: number; nr: number; reach: number; impressions: number; conversions: number }>();
  
  for (const r of records) {
    if (!r.targeting) continue;
    
    const isFirstParty = ["1st Party Data", "CDP", "Lookalike", "Custom Audience"].includes(r.targeting);
    const key = `${r.targeting}-${isFirstParty}`;
    const prev = targetingPerf.get(key) ?? { targeting: r.targeting, isFirstParty, spend: 0, nr: 0, reach: 0, impressions: 0, conversions: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    prev.reach += r.reach;
    prev.impressions += r.impressions;
    // Simulate conversions based on funnel stage and NR
    prev.conversions += r.funnelStage === "Conversion" ? r.nr * 0.15 : r.nr * 0.05;
    targetingPerf.set(key, prev);
  }
  
  // Calculate baseline (Broad targeting) for lift calculation
  const broadTargeting = Array.from(targetingPerf.values()).find(t => t.targeting === "Broad" && !t.isFirstParty);
  const baselineROI = broadTargeting && broadTargeting.spend > 0 ? broadTargeting.nr / broadTargeting.spend : 1;
  
  return Array.from(targetingPerf.values()).map(t => {
    const roi = t.spend > 0 ? t.nr / t.spend : 0;
    const cpm = t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0;
    const conversionRate = t.impressions > 0 ? (t.conversions / t.impressions) * 100 : 0;
    const incrementalLift = baselineROI > 0 ? ((roi - baselineROI) / baselineROI) * 100 : 0;
    
    return {
      targeting: t.targeting,
      isFirstParty: t.isFirstParty,
      spend: t.spend,
      nr: t.nr,
      roi,
      reach: t.reach,
      cpm,
      conversionRate,
      incrementalLift
    };
  }).sort((a, b) => b.roi - a.roi);
}

export function toAudienceSegmentMatrix(records: DailyRecord[]): Array<{ segment: string; channel: string; spend: number; nr: number; roi: number; reach: number; frequency: number; ctr: number; performance: "High" | "Medium" | "Low" }> {
  const segmentChannelMetrics = new Map<string, { segment: string; channel: string; spend: number; nr: number; reach: number; frequency: number; impressions: number; clicks: number }>();
  
  // Define key audience segments based on targeting
  const segmentMapping: Record<string, string> = {
    "Broad": "Mass Market",
    "Lookalike": "Similar Audiences", 
    "Interest": "Interest-Based",
    "Behavioral": "Behavioral",
    "1st Party Data": "Known Customers",
    "CDP": "Customer Database",
    "Custom Audience": "Custom Segments",
    "Demographics": "Demo Targeting"
  };
  
  for (const r of records) {
    if (!r.targeting || !r.channel) continue;
    
    const segment = segmentMapping[r.targeting] || r.targeting;
    const key = `${segment}-${r.channel}`;
    const prev = segmentChannelMetrics.get(key) ?? { segment, channel: r.channel, spend: 0, nr: 0, reach: 0, frequency: 0, impressions: 0, clicks: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    prev.reach += r.reach;
    prev.frequency += r.frequency;
    prev.impressions += r.impressions;
    // Simulate clicks based on channel and targeting sophistication
    const baseClickRate = r.channel === "Meta" ? 0.012 : r.channel === "Google" ? 0.035 : 0.008;
    const targetingMultiplier = ["Known Customers", "Customer Database", "Custom Segments"].includes(segment) ? 1.8 : 
                               ["Similar Audiences", "Behavioral"].includes(segment) ? 1.3 : 1.0;
    prev.clicks += r.impressions * baseClickRate * targetingMultiplier;
    segmentChannelMetrics.set(key, prev);
  }
  
  return Array.from(segmentChannelMetrics.values()).map(s => {
    const roi = s.spend > 0 ? s.nr / s.spend : 0;
    const ctr = s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0;
    
    // Determine performance tier
    let performance: "High" | "Medium" | "Low" = "Low";
    if (roi > 4.5 && ctr > 1.5) performance = "High";
    else if (roi > 3.0 && ctr > 0.8) performance = "Medium";
    
    return {
      segment: s.segment,
      channel: s.channel,
      spend: s.spend,
      nr: s.nr,
      roi,
      reach: s.reach,
      frequency: s.frequency,
      ctr,
      performance
    };
  }).sort((a, b) => b.roi - a.roi);
}

export function toFunnelConversionFlow(records: DailyRecord[]): Array<{ stage: string; visitors: number; conversionRate: number; dropOff: number; cost: number; efficiency: number }> {
  const funnelStages = ["Awareness", "Consideration", "Conversion"];
  const stageMetrics = new Map<string, { stage: string; spend: number; impressions: number; clicks: number; conversions: number }>();
  
  for (const r of records) {
    if (!r.funnelStage) continue;
    
    const prev = stageMetrics.get(r.funnelStage) ?? { stage: r.funnelStage, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    prev.spend += r.spend;
    prev.impressions += r.impressions;
    
    // Simulate engagement metrics based on funnel stage
    const baseClickRate = r.funnelStage === "Awareness" ? 0.008 : r.funnelStage === "Consideration" ? 0.025 : 0.045;
    const baseConversionRate = r.funnelStage === "Awareness" ? 0.001 : r.funnelStage === "Consideration" ? 0.015 : 0.08;
    
    prev.clicks += r.impressions * baseClickRate;
    prev.conversions += r.impressions * baseConversionRate;
    stageMetrics.set(r.funnelStage, prev);
  }
  
  // Calculate funnel flow
  const totalImpressions = Array.from(stageMetrics.values()).reduce((sum, s) => sum + s.impressions, 0);
  let cumulativeVisitors = totalImpressions;
  
  return funnelStages.map((stageName, index) => {
    const stageData = stageMetrics.get(stageName);
    if (!stageData) {
      return {
        stage: stageName,
        visitors: 0,
        conversionRate: 0,
        dropOff: 0,
        cost: 0,
        efficiency: 0
      };
    }
    
    const conversionRate = stageData.impressions > 0 ? (stageData.conversions / stageData.impressions) * 100 : 0;
    const stageVisitors = index === 0 ? stageData.impressions : cumulativeVisitors * (conversionRate / 100);
    const nextStageVisitors = index < funnelStages.length - 1 ? stageVisitors * (conversionRate / 100) : stageVisitors;
    const dropOff = stageVisitors > 0 ? ((stageVisitors - nextStageVisitors) / stageVisitors) * 100 : 0;
    const costPerVisitor = stageVisitors > 0 ? stageData.spend / stageVisitors : 0;
    const efficiency = stageData.spend > 0 ? stageData.conversions / stageData.spend * 1000 : 0; // Conversions per $1000 spend
    
    cumulativeVisitors = nextStageVisitors;
    
    return {
      stage: stageName,
      visitors: Math.round(stageVisitors),
      conversionRate,
      dropOff,
      cost: costPerVisitor,
      efficiency
    };
  });
}

// Flighting-specific analytics
export function toFlightingScenarioAnalysis(records: DailyRecord[]): Array<{ scenario: string; pattern: string; totalSpend: number; totalNR: number; roi: number; avgWeeklySpend: number; weeksActive: number; efficiency: string; recommendation: string }> {
  // Define flighting patterns based on spend distribution
  const flightingScenarios = [
    { scenario: "Always On", pattern: "Continuous", efficiency: "High", recommendation: "Maintain consistent presence" },
    { scenario: "1 Week On / 1 Week Off", pattern: "Alternating", efficiency: "Very High", recommendation: "Maximize impact with concentrated bursts" },
    { scenario: "2 Weeks On / 2 Weeks Off", pattern: "Burst", efficiency: "High", recommendation: "Build awareness then let decay naturally" },
    { scenario: "4 Weeks On / 4 Weeks Off", pattern: "Campaign", efficiency: "Medium", recommendation: "Seasonal or product launch approach" },
    { scenario: "Front-loaded", pattern: "Declining", efficiency: "Medium", recommendation: "Quick market penetration strategy" },
    { scenario: "Back-loaded", pattern: "Crescendo", efficiency: "High", recommendation: "Build momentum toward key periods" }
  ];
  
  // Simulate different flighting scenario performance
  const totalSpend = records.reduce((sum, r) => sum + r.spend, 0);
  const totalNR = records.reduce((sum, r) => sum + r.nr, 0);
  const baseROI = totalSpend > 0 ? totalNR / totalSpend : 0;
  
  return flightingScenarios.map((scenario, index) => {
    // Simulate different performance based on flighting pattern
    const patternMultipliers: Record<string, number> = {
      "Continuous": 1.0,
      "Alternating": 1.25, // Higher efficiency due to concentrated spend
      "Burst": 1.15,
      "Campaign": 0.95,
      "Declining": 0.92,
      "Crescendo": 1.18
    };
    
    const multiplier = patternMultipliers[scenario.pattern] || 1.0;
    const scenarioROI = baseROI * multiplier;
    const scenarioSpend = totalSpend * (0.8 + (index * 0.05)); // Vary spend slightly
    const scenarioNR = scenarioSpend * scenarioROI;
    
    // Calculate weeks active based on pattern
    const weeksActive = scenario.pattern === "Continuous" ? 52 : 
                      scenario.pattern === "Alternating" ? 26 :
                      scenario.pattern === "Burst" ? 26 :
                      scenario.pattern === "Campaign" ? 32 :
                      scenario.pattern === "Declining" ? 40 : 44;
    
    const avgWeeklySpend = weeksActive > 0 ? scenarioSpend / weeksActive : 0;
    
    return {
      scenario: scenario.scenario,
      pattern: scenario.pattern,
      totalSpend: scenarioSpend,
      totalNR: scenarioNR,
      roi: scenarioROI,
      avgWeeklySpend,
      weeksActive,
      efficiency: scenario.efficiency,
      recommendation: scenario.recommendation
    };
  }).sort((a, b) => b.roi - a.roi);
}

export function toFlightPatternTimeseries(records: DailyRecord[]): Array<{ week: number; alwaysOnSpend: number; alternatingSpend: number; burstSpend: number; alwaysOnNR: number; alternatingNR: number; burstNR: number; saturationIndex: number }> {
  const weeklyData = new Map<number, { week: number; spend: number; nr: number }>();
  
  for (const r of records) {
    const week = Math.floor((new Date(r.date).getTime() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const prev = weeklyData.get(week) ?? { week, spend: 0, nr: 0 };
    prev.spend += r.spend;
    prev.nr += r.nr;
    weeklyData.set(week, prev);
  }
  
  const weeklyArray = Array.from(weeklyData.values()).sort((a, b) => a.week - b.week);
  
  return weeklyArray.map((week, index) => {
    // Simulate different flighting patterns
    const alwaysOnSpend = week.spend; // Continuous spend
    const alternatingSpend = index % 2 === 0 ? week.spend * 2 : 0; // 1 week on, 1 week off
    const burstSpend = Math.floor(index / 2) % 2 === 0 ? week.spend * 2 : 0; // 2 weeks on, 2 weeks off
    
    // Calculate corresponding NR with different efficiency multipliers
    const alwaysOnNR = week.nr;
    const alternatingNR = alternatingSpend > 0 ? week.nr * 1.25 : 0; // Higher efficiency when active
    const burstNR = burstSpend > 0 ? week.nr * 1.15 : 0; // Moderate efficiency boost
    
    // Calculate saturation index (diminishing returns indicator)
    const spendPerWeek = week.spend;
    const saturationIndex = spendPerWeek > 0 ? Math.min(100, (week.nr / spendPerWeek) * 20) : 0;
    
    return {
      week: week.week,
      alwaysOnSpend,
      alternatingSpend,
      burstSpend,
      alwaysOnNR,
      alternatingNR,
      burstNR,
      saturationIndex
    };
  });
}

export function toBudgetScenarioOptimization(records: DailyRecord[]): Array<{ budgetLevel: string; totalBudget: number; roiOptimalSpend: number; salesOptimalSpend: number; roiOptimalNR: number; salesOptimalNR: number; roiOptimalROI: number; salesOptimalROI: number; efficiency: number }> {
  const totalSpend = records.reduce((sum, r) => sum + r.spend, 0);
  const totalNR = records.reduce((sum, r) => sum + r.nr, 0);
  const baseROI = totalSpend > 0 ? totalNR / totalSpend : 0;
  
  const budgetScenarios = [
    { budgetLevel: "25% Increase", multiplier: 1.25 },
    { budgetLevel: "Current Budget", multiplier: 1.0 },
    { budgetLevel: "15% Reduction", multiplier: 0.85 },
    { budgetLevel: "30% Reduction", multiplier: 0.7 },
    { budgetLevel: "50% Increase", multiplier: 1.5 }
  ];
  
  return budgetScenarios.map(scenario => {
    const totalBudget = totalSpend * scenario.multiplier;
    
    // ROI-optimized allocation (favor higher ROI channels, may sacrifice some volume)
    const roiOptimalSpend = totalBudget * 0.95; // Slight efficiency gain from optimization
    const roiOptimalNR = roiOptimalSpend * baseROI * (scenario.multiplier < 1 ? 1.1 : 0.95); // Diminishing returns at higher spend
    const roiOptimalROI = roiOptimalSpend > 0 ? roiOptimalNR / roiOptimalSpend : 0;
    
    // Sales-optimized allocation (maximize absolute NR, may accept lower ROI)
    const salesOptimalSpend = totalBudget;
    const salesOptimalNR = salesOptimalSpend * baseROI * (scenario.multiplier > 1 ? 0.9 : 1.0); // Volume discount effect
    const salesOptimalROI = salesOptimalSpend > 0 ? salesOptimalNR / salesOptimalSpend : 0;
    
    // Efficiency metric (how much performance per dollar)
    const efficiency = (roiOptimalNR + salesOptimalNR) / (roiOptimalSpend + salesOptimalSpend) * 100;
    
    return {
      budgetLevel: scenario.budgetLevel,
      totalBudget,
      roiOptimalSpend,
      salesOptimalSpend,
      roiOptimalNR,
      salesOptimalNR,
      roiOptimalROI,
      salesOptimalROI,
      efficiency
    };
  }).sort((a, b) => b.efficiency - a.efficiency);
}

export function toFlightTimingRecommendations(records: DailyRecord[]): Array<{ timing: string; scenario: string; expectedLift: number; confidence: string; bestChannels: string; reasoning: string; implementation: string }> {
  return [
    {
      timing: "Q1 Launch",
      scenario: "Front-loaded burst (4 weeks)",
      expectedLift: 35,
      confidence: "High",
      bestChannels: "TV + Digital",
      reasoning: "New year motivation, less competitive noise",
      implementation: "80% spend in first 4 weeks, maintain presence with 20%"
    },
    {
      timing: "Pre-Season",
      scenario: "2 weeks on / 1 week off",
      expectedLift: 28,
      confidence: "High", 
      bestChannels: "Digital + Retail",
      reasoning: "Build anticipation before peak demand period",
      implementation: "Start 6-8 weeks before season, increase frequency"
    },
    {
      timing: "Peak Season",
      scenario: "Always on with pulse",
      expectedLift: 22,
      confidence: "Medium",
      bestChannels: "All channels",
      reasoning: "Maintain share during high competition",
      implementation: "Base level + 50% boost during key weeks"
    },
    {
      timing: "Post-Holiday",
      scenario: "1 week on / 2 weeks off",
      expectedLift: 18,
      confidence: "Medium",
      bestChannels: "Digital focus",
      reasoning: "Budget-conscious period, need efficiency",
      implementation: "Concentrated digital bursts with strategic timing"
    },
    {
      timing: "Summer Lull",
      scenario: "Minimal presence",
      expectedLift: 8,
      confidence: "Low",
      bestChannels: "Owned + Earned",
      reasoning: "Low engagement period, preserve budget",
      implementation: "10-20% of normal spend, focus on retention"
    },
    {
      timing: "Back-to-School",
      scenario: "Crescendo build",
      expectedLift: 25,
      confidence: "High",
      bestChannels: "TV + Social",
      reasoning: "Routine change creates new habits",
      implementation: "Start low, build to 3x normal spend by week 3"
    }
  ];
}

export function toCompetitiveFlightAnalysis(records: DailyRecord[]): Array<{ period: string; ourSpend: number; competitorSpend: number; marketShare: number; shareOfVoice: number; efficiency: number; competitiveAdvantage: string; recommendation: string }> {
  const ourTotalSpend = records.reduce((sum, r) => sum + r.spend, 0);
  const ourTotalNR = records.reduce((sum, r) => sum + r.nr, 0);
  
  const periods = ["Q1", "Q2", "Q3", "Q4"];
  
  return periods.map((period, index) => {
    const ourSpend = ourTotalSpend / 4; // Quarterly split
    const ourNR = ourTotalNR / 4;
    
    // Simulate competitive data
    const competitorSpend = ourSpend * (0.8 + Math.random() * 0.6); // 80%-140% of our spend
    const totalMarketSpend = ourSpend + competitorSpend + (ourSpend * 1.5); // Include other competitors
    
    const marketShare = (ourNR / (ourNR * 2.5)) * 100; // Simulate market share
    const shareOfVoice = (ourSpend / totalMarketSpend) * 100;
    const efficiency = ourSpend > 0 ? ourNR / ourSpend : 0;
    
    // Competitive advantage analysis
    const sovVsMs = shareOfVoice - marketShare;
    const competitiveAdvantage = sovVsMs > 5 ? "Over-spending" : 
                                sovVsMs < -5 ? "Efficient" : "Balanced";
    
    // Recommendations based on competitive position
    const recommendation = competitiveAdvantage === "Over-spending" ? 
      "Reduce spend or improve efficiency" :
      competitiveAdvantage === "Efficient" ? 
      "Opportunity to increase investment" :
      "Maintain current balance";
    
    return {
      period,
      ourSpend,
      competitorSpend,
      marketShare,
      shareOfVoice,
      efficiency,
      competitiveAdvantage,
      recommendation
    };
  });
}


