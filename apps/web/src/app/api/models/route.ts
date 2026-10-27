import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

import { listModels } from "@/lib/repo";


export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sort = (sp.get("sort") as "score" | "priceInput" | "priceOutput" | "throughputTps" | "publishedAt") ?? undefined;
  const order = (sp.get("order") as "asc" | "desc") ?? undefined;
  const page = sp.get("page") ? Number(sp.get("page")) : undefined;
  const pageSize = sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined;
  const result = await listModels({ sort, order, page, pageSize });
  return NextResponse.json(result, {
    headers: { "cache-control": "public, max-age=30, s-maxage=30" },
  });
}
