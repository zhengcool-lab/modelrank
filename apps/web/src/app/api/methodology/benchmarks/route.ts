import { NextResponse } from "next/server";
import { listBenchmarks } from "@/lib/repo";


export async function GET() {
  const benchmarks = await listBenchmarks();
  return NextResponse.json(
    { benchmarks, total: benchmarks.length },
    { headers: { "cache-control": "public, max-age=3600, s-maxage=3600" } },
  );
}
