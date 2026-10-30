"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { championshipPath } from "@/lib/championships";
import { LoadingScreen } from "./ui";

export function LegacyChampionshipRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loading, lastChampionship, championships } = useApp();

  useEffect(() => {
    if (loading) return;
    const slug = lastChampionship?.slug ?? championships[0]?.slug;
    const qs = searchParams.toString();
    if (!slug) {
      router.replace("/");
      return;
    }
    const dest = `${championshipPath(slug, pathname)}${qs ? `?${qs}` : ""}`;
    router.replace(dest);
  }, [
    championships,
    lastChampionship,
    loading,
    pathname,
    router,
    searchParams,
  ]);

  return <LoadingScreen label="Opening championship…" />;
}
