import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Week board — ESFF",
  description:
    "See every prediction for a selected week and copy the sheet to your clipboard.",
};

export default function PicksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
