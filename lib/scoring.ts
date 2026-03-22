export interface ScoreInputs {
  totalPRs: number;
  mergedPRs: number;
  accountAgeYears: number;
  reposActiveIn: number;
  recentEventCount: number;
  isWhitelisted: boolean;
  isBlocked: boolean;
}

/**
 * Computes a 0-100 trust score from contributor metrics.
 *
 * Weights:
 *   40% — merge ratio (merged / total)
 *   25% — account age  (capped at 5 years)
 *   20% — volume credibility (diminishing returns past 50 merged PRs)
 *   15% — cross-repo spread penalty (high spread + low merge = bot)
 *
 * Overrides:
 *   - Whitelisted contributors always return 100.
 *   - Blocked contributors always return 0.
 *
 * Bot detection:
 *   If a user has >30 repos active and <5% merge rate their score is
 *   hard-capped at 10 regardless of other factors.
 */
export function computeTrustScore(inputs: ScoreInputs): number {
  if (inputs.isBlocked) return 0;
  if (inputs.isWhitelisted) return 100;

  const { totalPRs, mergedPRs, accountAgeYears, reposActiveIn } = inputs;

  // -- Merge ratio (0-1) --
  const mergeRatio = totalPRs > 0 ? mergedPRs / totalPRs : 0;

  // -- Bot detection --
  if (reposActiveIn > 30 && mergeRatio < 0.05) {
    return Math.min(10, Math.round(mergeRatio * 100));
  }

  // -- Component scores (each 0-100) --

  // Merge quality: linear 0-100
  const mergeScore = mergeRatio * 100;

  // Account age: logarithmic ramp, capped at 5 years = 100
  const ageScore = Math.min(100, (Math.log1p(accountAgeYears) / Math.log1p(5)) * 100);

  // Volume credibility: diminishing returns — 50+ merged PRs gives full credit
  const volumeScore = Math.min(100, (Math.sqrt(mergedPRs) / Math.sqrt(50)) * 100);

  // Cross-repo spread: penalise high spread only when merge rate is low
  let spreadPenalty = 0;
  if (reposActiveIn > 10 && mergeRatio < 0.3) {
    spreadPenalty = Math.min(100, (reposActiveIn / 50) * 100) * (1 - mergeRatio);
  }

  const raw =
    mergeScore * 0.4 +
    ageScore * 0.25 +
    volumeScore * 0.2 -
    spreadPenalty * 0.15;

  return Math.max(0, Math.min(100, Math.round(raw)));
}
