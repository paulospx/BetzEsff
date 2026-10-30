import type { Metadata } from "next";
import { ChampionshipShell } from "@/components/ChampionshipShell";
import { readDb } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const db = await readDb();
    const championship = db.championships.find((c) => c.slug === slug);
    const app = db.settings.appName;
    if (!championship) {
      return { title: `Championship not found — ${app}` };
    }
    return {
      title: `${championship.name} — ${app}`,
      description: `${championship.name} prediction poll. Exact score 5 pts, correct result 3 pts.`,
    };
  } catch {
    return { title: "Championship" };
  }
}

export default function ChampionshipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChampionshipShell>{children}</ChampionshipShell>;
}
