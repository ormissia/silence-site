import { NextRequest, NextResponse } from "next/server";
import { getHighlightBatch } from "@/lib/reading";

export function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("index");
  if (raw === null || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }
  return NextResponse.json(getHighlightBatch(Number(raw)));
}
