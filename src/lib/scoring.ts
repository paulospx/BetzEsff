import type { Match, Outcome, Prediction, ScoredPrediction } from "./types";

export function getOutcome(home: number, away: number): Outcome {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

/**
 * Scoring rules:
 * - Exact score: 5 points
 * - Correct winner/draw (wrong score): 3 points
 * - Otherwise: 0 points
 */
export function scorePrediction(
  prediction: Prediction,
  match: Match
): ScoredPrediction {
  if (
    match.homeScore === null ||
    match.awayScore === null ||
    match.status !== "finished"
  ) {
    return {
      prediction,
      points: 0,
      exact: false,
      correctOutcome: false,
    };
  }

  const exact =
    prediction.homeScore === match.homeScore &&
    prediction.awayScore === match.awayScore;

  if (exact) {
    return {
      prediction,
      points: 5,
      exact: true,
      correctOutcome: true,
    };
  }

  const predictedOutcome = getOutcome(
    prediction.homeScore,
    prediction.awayScore
  );
  const actualOutcome = getOutcome(match.homeScore, match.awayScore);
  const correctOutcome = predictedOutcome === actualOutcome;

  return {
    prediction,
    points: correctOutcome ? 3 : 0,
    exact: false,
    correctOutcome,
  };
}

export function pointsLabel(points: number): string {
  if (points === 5) return "Exact score";
  if (points === 3) return "Correct result";
  return "Miss";
}
