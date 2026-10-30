import { NextRequest, NextResponse } from "next/server";
import { readDb, uid, writeDb } from "@/lib/db";
import {
  isValidChampionshipStatus,
  nextChampionshipColor,
  uniqueSlug,
} from "@/lib/championships";
import type { ChampionshipStatus } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.championships);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { error: "Championship name is required." },
      { status: 400 }
    );
  }
  if (name.length > 40) {
    return NextResponse.json(
      { error: "Name must be 40 characters or fewer." },
      { status: 400 }
    );
  }

  const shortName = String(body.shortName ?? name).trim().slice(0, 16);
  const season = String(body.season ?? "").trim().slice(0, 16);
  const description = String(body.description ?? "").trim().slice(0, 160);
  const color =
    String(body.color ?? "").trim() || nextChampionshipColor(db.championships);

  if (
    db.championships.some((c) => c.name.toLowerCase() === name.toLowerCase())
  ) {
    return NextResponse.json(
      { error: "A championship with that name already exists." },
      { status: 409 }
    );
  }

  const championship = {
    id: uid("champ"),
    slug: uniqueSlug(name, db.championships),
    name,
    shortName: shortName || name.slice(0, 16),
    season,
    description,
    color,
    status: "active" as ChampionshipStatus,
    createdAt: new Date().toISOString(),
  };
  db.championships.push(championship);
  await writeDb(db);
  return NextResponse.json(championship, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const championshipId = String(body.championshipId ?? "");
  const championship = db.championships.find((c) => c.id === championshipId);
  if (!championship) {
    return NextResponse.json(
      { error: "Championship not found." },
      { status: 404 }
    );
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json(
        { error: "Championship name cannot be empty." },
        { status: 400 }
      );
    }
    if (name.length > 40) {
      return NextResponse.json(
        { error: "Name must be 40 characters or fewer." },
        { status: 400 }
      );
    }
    if (
      db.championships.some(
        (c) =>
          c.id !== championship.id &&
          c.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: "A championship with that name already exists." },
        { status: 409 }
      );
    }
    championship.name = name;
  }

  if (body.shortName !== undefined) {
    const shortName = String(body.shortName).trim().slice(0, 16);
    championship.shortName = shortName || championship.name.slice(0, 16);
  }
  if (body.season !== undefined) {
    championship.season = String(body.season).trim().slice(0, 16);
  }
  if (body.description !== undefined) {
    championship.description = String(body.description).trim().slice(0, 160);
  }
  if (body.color !== undefined) {
    const color = String(body.color).trim();
    if (color) championship.color = color;
  }
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!isValidChampionshipStatus(status)) {
      return NextResponse.json(
        { error: "Status must be active or archived." },
        { status: 400 }
      );
    }
    championship.status = status;
  }

  await writeDb(db);
  return NextResponse.json(championship);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "");
  const db = await readDb();

  if (pin !== db.settings.adminPin) {
    return NextResponse.json({ error: "Invalid admin PIN." }, { status: 401 });
  }

  const championshipId = String(body.championshipId ?? "");
  const championship = db.championships.find((c) => c.id === championshipId);
  if (!championship) {
    return NextResponse.json(
      { error: "Championship not found." },
      { status: 404 }
    );
  }

  const weekCount = db.weeks.filter(
    (w) => w.championshipId === championshipId
  ).length;
  if (weekCount > 0) {
    return NextResponse.json(
      {
        error:
          "This championship still has weeks. Archive it instead of deleting, so results stay intact.",
      },
      { status: 409 }
    );
  }

  db.championships = db.championships.filter((c) => c.id !== championshipId);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
