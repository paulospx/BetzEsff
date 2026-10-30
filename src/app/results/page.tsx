"use client";

import { Suspense } from "react";
import { LegacyChampionshipRedirect } from "@/components/LegacyChampionshipRedirect";
import { LoadingScreen } from "@/components/ui";

export default function ResultsRedirectPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Opening championship…" />}>
      <LegacyChampionshipRedirect />
    </Suspense>
  );
}
