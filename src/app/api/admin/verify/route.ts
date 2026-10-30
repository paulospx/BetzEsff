import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ ok: false, error: "Invalid admin PIN." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
