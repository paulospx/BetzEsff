import { NextRequest, NextResponse } from "next/server";
import { readDb, uid, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.weeks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const championshipId = String(body.championshipId ?? "").trim();
  const label = String(body.label ?? "").trim();
  const startDate = String(body.startDate ?? "").trim();
  const endDate = String(body.endDate ?? "").trim();

  if (!championshipId || !label || !startDate || !endDate) {
    return NextResponse.json(
      {
        error:
          "Championship, label, start date, and end date are required.",
      },
      { status: 400 }
    );
  }

  if (!db.championships.some((c) => c.id === championshipId)) {
    return NextResponse.json(
      { error: "Championship not found." },
      { status: 404 }
    );
  }

  const week = {
    id: uid("week"),
    championshipId,
    label,
    startDate,
    endDate,
    createdAt: new Date().toISOString(),
  };
  db.weeks.push(week);
  await writeDb(db);
  return NextResponse.json(week, { status: 201 });
}
