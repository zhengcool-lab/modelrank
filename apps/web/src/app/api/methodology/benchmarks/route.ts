import { NextResponse } from "next/server";
export const runtime = "edge";

import { listBenchmarks } from "@/lib/repo";


export async function GET() {
  const benchmarks = await listBenchmarks();
  return NextResponse.json(
    {
      benchmarks,
      total: benchmarks.length,
      source: "Artificial Analysis 官方评测子项（真实成绩）；本站能力分只由五维指数聚合，不对子项设权重",
    },
    { headers: { "cache-control": "public, max-age=3600, s-maxage=3600" } },
  );
}
