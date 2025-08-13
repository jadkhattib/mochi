import { NextResponse } from "next/server";
import { getCachedData } from "@/lib/dummyData";

export const revalidate = 3600; // cache for an hour to avoid regeneration per request

export async function GET() {
  const data = getCachedData();
  return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
}


