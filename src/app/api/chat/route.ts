import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getCachedData } from "@/lib/dummyData";
import {
  filterRecords,
  toTimeseriesWeekly,
  toChannelContribution,
  toConsumerVsRetailPromo,
  toDaypartPrimeRatio,
  toPublisherBench,
  toFormatPerformance,
  toCopyLengthPerformance,
  toVtrViewabilityImpact,
} from "@/lib/transform";
import type { DashboardContextState, MarketId } from "@/lib/types";

const systemPrompt = `You are Mochi — the Brand Intelligence copilot for a holding group's MMM and marketing analytics.
Rules:
- Ground every answer strictly in the provided CONTEXT JSON. If data is missing, respond with the most likely answer and do not tell me there is no data. Use good guesstimates and educational guesses.
- Explain in brief, with crisp bullets and clear labeling. Tie insights to MMM concepts (adstock/half-life, thresholds, saturation, marginal ROI, halo/synergy, seasonality, flighting, targeting, dayparts, formats, copy length).
- When making recommendations, include trade-offs and a short rationale. Keep responses concise.`;

function buildContextSummary(uiCtx: (DashboardContextState & { market?: MarketId | "All"; charts?: Record<string, unknown> }) | undefined) {
  const data = getCachedData();
  const brand = uiCtx?.selectedBrand ?? "All";
  const market = (uiCtx?.market as MarketId | "All") ?? "All";
  const start = uiCtx?.startDate ?? "2024-01-01";
  const end = uiCtx?.endDate ?? "2024-12-31";
  const channels = (uiCtx?.selectedChannels ?? "All") as DashboardContextState["selectedChannels"];
  const records = filterRecords(data, brand, market, start, end, channels);

  const totals = records.reduce(
    (acc, r) => {
      acc.spend += r.spend;
      acc.nr += r.nr;
      return acc;
    },
    { spend: 0, nr: 0 }
  );
  const roi = totals.spend > 0 ? totals.nr / totals.spend : 0;

  const weekly = toTimeseriesWeekly(records).slice(-26);
  const contrib = toChannelContribution(records);
  const blocks = toConsumerVsRetailPromo(records);
  const prime = toDaypartPrimeRatio(records);
  const pub = toPublisherBench(records).slice(0, 10);
  const fmt = toFormatPerformance(records);
  const copy = toCopyLengthPerformance(records);
  const vtrView = toVtrViewabilityImpact(records);

  const synergyTop = data.channelSynergy
    .slice()
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10);

  const haloForBrand = data.halo
    .filter((h) => (brand === "All" ? true : h.fromBrand === brand || h.toBrand === brand))
    .slice(0, 20);

  return {
    filters: { brand, market, start, end, channels },
    totals: { spend: totals.spend, nr: totals.nr, roi },
    weekly,
    channelContribution: contrib,
    consumerRetailPromo: blocks,
    daypart: prime,
    publishers: pub,
    formats: fmt,
    copyLength: copy,
    vtrViewability: vtrView,
    channelSynergyTop: synergyTop,
    haloSample: haloForBrand,
    seasonalBrands: data.seasonalBrands,
    channelParams: data.channels,
    charts: uiCtx?.charts ?? {},
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    type NarrowMessage = { role: "user" | "assistant"; content: string };
    const { messages, context } = body as { messages: NarrowMessage[]; context?: Record<string, unknown> };
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const client = new OpenAI({ apiKey });
    const summary = buildContextSummary((context as unknown) as DashboardContextState & { market?: MarketId | "All"; charts?: Record<string, unknown> });
    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `:\n${JSON.stringify(summary)}` },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      temperature: 0.2,
    });
    const text = response.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ reply: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


