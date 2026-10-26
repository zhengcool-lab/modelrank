import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/repo";


export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = await getModel(id);
  if (!model) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(model, {
    headers: { "cache-control": "public, max-age=60, s-maxage=60" },
  });
}
