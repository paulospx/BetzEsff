# BetzEsff — Football prediction league

Guess match scores with friends. Built as a focused web app with clear UX (Nielsen Norman Group principles: status visibility, recognition over recall, error prevention, user control).

Each **championship** is its own prediction poll — own fixtures, own table, own race. Players are shared across polls so you pick your name once.

## Scoring

| Outcome | Points |
|--------|--------|
| Exact score | **5** |
| Correct winner or draw (wrong score) | **3** |
| Otherwise | **0** |

## Features

- **Championships** — Hub of polls (Liga, EURO, cups…). Open fixtures and your table stay scoped to the poll you opened
- **Predict** — Pick scores for open fixtures in the current championship (steppers, bulk save)
- **Results** — Final scores, per-match points, championship table
- **Race** — Animated bar-chart race of that championship’s standings
- **Admin** — Create championships, then add weeks and matches inside the one you’re working on
- **Who are you?** — Lightweight player switch (shared device friendly)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo data

On first run, the app seeds:

- Players: Alex, Sam, Jordan, Riley  
- **Liga Portugal** — Week 1 finished, Week 2 open  
- **EURO Qualificação** — Qualifiers 1 open 

**Admin PIN:** `1234` (session-stored after unlock)

Data is stored in `data/db.json` (created automatically, gitignored).

## Screens

| Path | Purpose |
|------|---------|
| `/` | Championship hub — pick a poll |
| `/c/[slug]` | Championship home: status, open fixtures, that poll’s table |
| `/c/[slug]/predict` | Place / edit score predictions |
| `/c/[slug]/picks` | Week board for this championship |
| `/c/[slug]/results` | Results + points for this championship |
| `/c/[slug]/race` | Bar / line race for this championship |
| `/who` | Select or create a player |
| `/admin` | Championships, weeks, matches, lock, final scores |
| `/predict` and other legacy paths | Redirect into the last championship you used |

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS  
- JSON file store via API routes (no external DB required)

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # run production server
```
