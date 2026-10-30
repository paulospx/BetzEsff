import { NextRequest, NextResponse } from "next/server";
import { readDb, resetToSeed } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const fresh = await resetToSeed();
  return NextResponse.json({
    ok: true,
    players: fresh.players.length,
    weeks: fresh.weeks.length,
    matches: fresh.matches.length,
  });
}
