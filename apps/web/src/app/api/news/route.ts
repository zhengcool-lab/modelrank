import { NextRequest, NextResponse } from "next/server";
import { listNews } from "@/lib/repo";


export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? "all";
  const result = await listNews(category);
  return NextResponse.json(result, {
    headers: { "cache-control": "public, max-age=120, s-maxage=120" },
  });
}
