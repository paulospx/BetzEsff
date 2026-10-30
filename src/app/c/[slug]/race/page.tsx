"use client";

import { useCallback, useMemo, useState } from "react";
import { BarChartRace } from "@/components/BarChartRace";
import { LineChartRace } from "@/components/LineChartRace";
import { PageHeader, SegmentedControl } from "@/components/ui";
import { useChampionshipScope } from "@/context/AppContext";
import {
  buildRaceSnapshots,
  clampIndex,
  indexAfterStepChange,
} from "@/lib/race";
import type { RaceStep } from "@/lib/types";

type RaceView = "bars" | "lines";

export default function RacePage() {
  const { championship, race, players, weeks, matches, predictions } =
    useChampionshipScope();
  const [view, setView] = useState<RaceView>("bars");
  const [step, setStep] = useState<RaceStep>("week");
  const [rawIndex, setRawIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showCumulative, setShowCumulative] = useState(true);

  const matchRace = useMemo(
    () =>
      buildRaceSnapshots({
        players,
        weeks,
        matches,
        predictions,
        step: "match",
      }),
    [players, weeks, matches, predictions]
  );

  const snapshots = step === "match" ? matchRace : race;
  const index = clampIndex(rawIndex, snapshots.length);

  const onIndexChange = useCallback((next: number) => {
    setRawIndex(next);
  }, []);
  const onPlayingChange = useCallback((next: boolean) => {
    setPlaying(next);
  }, []);
  const onToggleCumulative = useCallback(() => {
    setShowCumulative((value) => !value);
  }, []);

  function changeStep(next: RaceStep) {
    if (next === step) return;
    const from = step === "match" ? matchRace : race;
    const to = next === "match" ? matchRace : race;
    setPlaying(false);
    setRawIndex(indexAfterStepChange(from, index, to, next));
    setStep(next);
  }

  const chartProps = {
    snapshots,
    step,
    index,
    playing,
    showCumulative,
    onIndexChange,
    onPlayingChange,
    onToggleCumulative,
  };

  return (
    <div>
      <PageHeader
        title="Standings race"
        description={`Watch the ${championship?.shortName ?? "championship"} table move. By week shows the standings after each finished week. By match replays every finished fixture, so you can see who that result helped.`}
        action={
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <div>
              <p
                aria-hidden
                className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]"
              >
                Chart
              </p>
              <SegmentedControl
                ariaLabel="Chart"
                value={view}
                onChange={setView}
                options={[
                  { value: "bars", label: "Bars", hint: "Ranked bars" },
                  { value: "lines", label: "Lines", hint: "Trajectory lines" },
                ]}
              />
            </div>
            <div>
              <p
                aria-hidden
                className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]"
              >
                Advance by
              </p>
              <SegmentedControl
                ariaLabel="Advance by"
                value={step}
                onChange={changeStep}
                options={[
                  {
                    value: "week",
                    label: "Week",
                    hint: "After each finished week",
                  },
                  {
                    value: "match",
                    label: "Match",
                    hint: "After each finished match",
                  },
                ]}
              />
            </div>
          </div>
        }
      />
      {view === "bars" ? (
        <BarChartRace {...chartProps} />
      ) : (
        <LineChartRace {...chartProps} />
      )}
    </div>
  );
}
