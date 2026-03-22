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
 * Weights (before velocity penalty):
 *   40% — merge ratio (Bayesian-smoothed, needs 5+ PRs for full confidence)
 *   25% — account age  (capped at 5 years)
 *   20% — volume credibility (diminishing returns past 50 merged PRs)
 *   15% — cross-repo spread penalty (high spread + low merge = bot)
 *
 * Velocity penalty (ATO defense):
 *   recentEventCount tracks events in the last 24 hours. A spike
 *   relative to the account's historical baseline triggers a multiplier
 *   that can halve the final score, catching hijacked dormant accounts.
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

  const {
    totalPRs,
    mergedPRs,
    accountAgeYears,
    reposActiveIn,
    recentEventCount,
  } = inputs;

  const mergeRatio = totalPRs > 0 ? mergedPRs / totalPRs : 0;

  if (reposActiveIn > 30 && mergeRatio < 0.05) {
    return Math.min(10, Math.round(mergeRatio * 100));
  }

  // -- Component scores (each 0-100) --

  // Bayesian-smoothed merge quality: assume a prior of 50% over a
  // virtual sample of PRIOR_WEIGHT PRs. With only 1 real PR the score
  // is pulled strongly toward 50%; at 5+ PRs the real ratio dominates.
  const PRIOR_WEIGHT = 5;
  const PRIOR_RATE = 0.5;
  const smoothedMergeRatio =
    (mergedPRs + PRIOR_WEIGHT * PRIOR_RATE) / (totalPRs + PRIOR_WEIGHT);
  const mergeScore = smoothedMergeRatio * 100;

  // Account age: logarithmic ramp, capped at 5 years = 100
  const ageScore = Math.min(
    100,
    (Math.log1p(accountAgeYears) / Math.log1p(5)) * 100
  );

  // Volume credibility: diminishing returns — 50+ merged PRs = full credit
  const volumeScore = Math.min(
    100,
    (Math.sqrt(mergedPRs) / Math.sqrt(50)) * 100
  );

  // Cross-repo spread: penalise high spread only when merge rate is low
  let spreadPenalty = 0;
  if (reposActiveIn > 10 && mergeRatio < 0.3) {
    spreadPenalty =
      Math.min(100, (reposActiveIn / 50) * 100) * (1 - mergeRatio);
  }

  let raw =
    mergeScore * 0.4 +
    ageScore * 0.25 +
    volumeScore * 0.2 -
    spreadPenalty * 0.15;

  // -- Velocity penalty (ATO / burst-spam defense) --
  // recentEventCount = events in the last 24 h.
  // Expected daily baseline = totalPRs spread over account lifetime in days.
  // A spike 5x above baseline triggers progressive decay up to 50%.
  if (recentEventCount > 0 && totalPRs > 0) {
    const accountDays = Math.max(1, accountAgeYears * 365.25);
    const dailyBaseline = Math.max(0.5, totalPRs / accountDays);
    const spikeRatio = recentEventCount / dailyBaseline;

    if (spikeRatio > 5) {
      // Scale from 0% penalty at 5x to 50% penalty at 20x+
      const penaltyFactor = Math.min(0.5, (spikeRatio - 5) / 30);
      raw *= 1 - penaltyFactor;
    }
  }

  return Math.max(0, Math.min(100, Math.round(raw)));
}
