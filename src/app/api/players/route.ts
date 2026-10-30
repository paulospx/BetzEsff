import { NextRequest, NextResponse } from "next/server";
import { nextPlayerColor, readDb, uid, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.players);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > 24) {
    return NextResponse.json(
      { error: "Name must be 24 characters or fewer." },
      { status: 400 }
    );
  }

  const db = await readDb();
  if (db.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json(
      { error: "A player with that name already exists." },
      { status: 409 }
    );
  }

  const player = {
    id: uid("player"),
    name,
    color: nextPlayerColor(db),
    createdAt: new Date().toISOString(),
  };
  db.players.push(player);
  await writeDb(db);
  return NextResponse.json(player, { status: 201 });
}
