import { NextRequest, NextResponse } from "next/server";
import { readDb, uid, writeDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  const db = await readDb();
  const list = playerId
    ? db.predictions.filter((p) => p.playerId === playerId)
    : db.predictions;
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const playerId = String(body.playerId ?? "");
  const matchId = String(body.matchId ?? "");
  const homeScore = Number(body.homeScore);
  const awayScore = Number(body.awayScore);

  if (!playerId || !matchId) {
    return NextResponse.json(
      { error: "Player and match are required." },
      { status: 400 }
    );
  }

  if (
    Number.isNaN(homeScore) ||
    Number.isNaN(awayScore) ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0 ||
    homeScore > 20 ||
    awayScore > 20
  ) {
    return NextResponse.json(
      { error: "Scores must be whole numbers between 0 and 20." },
      { status: 400 }
    );
  }

  const db = await readDb();
  const player = db.players.find((p) => p.id === playerId);
  if (!player) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  const match = db.matches.find((m) => m.id === matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (match.status !== "open") {
    return NextResponse.json(
      { error: "Predictions are closed for this match." },
      { status: 403 }
    );
  }

  const existing = db.predictions.find(
    (p) => p.playerId === playerId && p.matchId === matchId
  );

  if (existing) {
    existing.homeScore = homeScore;
    existing.awayScore = awayScore;
    existing.updatedAt = new Date().toISOString();
    await writeDb(db);
    return NextResponse.json(existing);
  }

  const prediction = {
    id: uid("pred"),
    matchId,
    playerId,
    homeScore,
    awayScore,
    updatedAt: new Date().toISOString(),
  };
  db.predictions.push(prediction);
  await writeDb(db);
  return NextResponse.json(prediction, { status: 201 });
}

/** Save multiple predictions at once (one week submit) */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const playerId = String(body.playerId ?? "");
  const items = Array.isArray(body.predictions) ? body.predictions : [];

  if (!playerId) {
    return NextResponse.json({ error: "Player is required." }, { status: 400 });
  }

  const db = await readDb();
  if (!db.players.some((p) => p.id === playerId)) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  const saved = [];
  const errors: string[] = [];

  for (const item of items) {
    const matchId = String(item.matchId ?? "");
    const homeScore = Number(item.homeScore);
    const awayScore = Number(item.awayScore);

    const match = db.matches.find((m) => m.id === matchId);
    if (!match) {
      errors.push(`Match ${matchId} not found.`);
      continue;
    }
    if (match.status !== "open") {
      errors.push(`${match.homeTeam} vs ${match.awayTeam}: predictions closed.`);
      continue;
    }
    if (
      Number.isNaN(homeScore) ||
      Number.isNaN(awayScore) ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      errors.push(
        `${match.homeTeam} vs ${match.awayTeam}: invalid score.`
      );
      continue;
    }

    const existing = db.predictions.find(
      (p) => p.playerId === playerId && p.matchId === matchId
    );
    if (existing) {
      existing.homeScore = homeScore;
      existing.awayScore = awayScore;
      existing.updatedAt = new Date().toISOString();
      saved.push(existing);
    } else {
      const prediction = {
        id: uid("pred"),
        matchId,
        playerId,
        homeScore,
        awayScore,
        updatedAt: new Date().toISOString(),
      };
      db.predictions.push(prediction);
      saved.push(prediction);
    }
  }

  await writeDb(db);
  return NextResponse.json({ saved, errors });
}
