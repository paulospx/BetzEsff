import { NextRequest, NextResponse } from "next/server";
import { readDb, uid, writeDb } from "@/lib/db";
import type { MatchStatus } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.matches);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const weekId = String(body.weekId ?? "");
  const homeTeam = String(body.homeTeam ?? "").trim();
  const awayTeam = String(body.awayTeam ?? "").trim();
  const kickoff = String(body.kickoff ?? "").trim();

  if (!weekId || !homeTeam || !awayTeam || !kickoff) {
    return NextResponse.json(
      { error: "Week, both teams, and kickoff are required." },
      { status: 400 }
    );
  }

  if (!db.weeks.some((w) => w.id === weekId)) {
    return NextResponse.json({ error: "Week not found." }, { status: 404 });
  }

  if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
    return NextResponse.json(
      { error: "Home and away teams must be different." },
      { status: 400 }
    );
  }

  const match = {
    id: uid("match"),
    weekId,
    homeTeam,
    awayTeam,
    kickoff: new Date(kickoff).toISOString(),
    homeScore: null,
    awayScore: null,
    status: "open" as MatchStatus,
    createdAt: new Date().toISOString(),
  };

  db.matches.push(match);
  await writeDb(db);
  return NextResponse.json(match, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const matchId = String(body.matchId ?? "");
  const match = db.matches.find((m) => m.id === matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (body.status === "open" || body.status === "locked" || body.status === "finished") {
    match.status = body.status;
  }

  if (body.homeTeam !== undefined) match.homeTeam = String(body.homeTeam).trim();
  if (body.awayTeam !== undefined) match.awayTeam = String(body.awayTeam).trim();
  if (body.kickoff !== undefined) {
    match.kickoff = new Date(String(body.kickoff)).toISOString();
  }

  if (body.homeScore !== undefined || body.awayScore !== undefined) {
    const home =
      body.homeScore === null || body.homeScore === ""
        ? null
        : Number(body.homeScore);
    const away =
      body.awayScore === null || body.awayScore === ""
        ? null
        : Number(body.awayScore);

    if (home !== null && (Number.isNaN(home) || home < 0 || !Number.isInteger(home))) {
      return NextResponse.json(
        { error: "Home score must be a whole number ≥ 0." },
        { status: 400 }
      );
    }
    if (away !== null && (Number.isNaN(away) || away < 0 || !Number.isInteger(away))) {
      return NextResponse.json(
        { error: "Away score must be a whole number ≥ 0." },
        { status: 400 }
      );
    }

    match.homeScore = home;
    match.awayScore = away;

    if (home !== null && away !== null) {
      match.status = "finished";
    }
  }

  await writeDb(db);
  return NextResponse.json(match);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const matchId = String(body.matchId ?? "");
  const before = db.matches.length;
  db.matches = db.matches.filter((m) => m.id !== matchId);
  db.predictions = db.predictions.filter((p) => p.matchId !== matchId);

  if (db.matches.length === before) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  await writeDb(db);
  return NextResponse.json({ ok: true });
}
