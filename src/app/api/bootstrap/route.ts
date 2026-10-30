import { NextResponse } from "next/server";
import { computeAllChampionshipTables, readDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  const { standingsByChampionship, raceByChampionship } =
    computeAllChampionshipTables(db);

  return NextResponse.json({
    championships: db.championships,
    players: db.players,
    weeks: db.weeks,
    matches: db.matches,
    predictions: db.predictions,
    settings: { appName: db.settings.appName },
    standingsByChampionship,
    raceByChampionship,
  });
}
