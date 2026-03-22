import { describe, it, expect } from "vitest";
import { computeTrustScore, ScoreInputs } from "./scoring";

const base: ScoreInputs = {
  totalPRs: 0,
  mergedPRs: 0,
  accountAgeYears: 0,
  reposActiveIn: 0,
  recentEventCount: 0,
  isWhitelisted: false,
  isBlocked: false,
};

function score(overrides: Partial<ScoreInputs>): number {
  return computeTrustScore({ ...base, ...overrides });
}

describe("computeTrustScore", () => {
  // --- Overrides ---

  it("returns 0 for blocked contributors regardless of stats", () => {
    expect(
      score({
        isBlocked: true,
        totalPRs: 100,
        mergedPRs: 100,
        accountAgeYears: 10,
      })
    ).toBe(0);
  });

  it("returns 100 for whitelisted contributors regardless of stats", () => {
    expect(
      score({
        isWhitelisted: true,
        totalPRs: 0,
        mergedPRs: 0,
        accountAgeYears: 0,
      })
    ).toBe(100);
  });

  it("blocked takes precedence over whitelisted", () => {
    expect(score({ isBlocked: true, isWhitelisted: true })).toBe(0);
  });

  // --- Bot detection ---

  it("hard-caps at 10 when >30 repos and <5% merge rate", () => {
    const s = score({
      totalPRs: 200,
      mergedPRs: 5,
      accountAgeYears: 3,
      reposActiveIn: 45,
    });
    expect(s).toBeLessThanOrEqual(10);
  });

  it("does NOT trigger bot detection at exactly 30 repos", () => {
    const s = score({
      totalPRs: 200,
      mergedPRs: 5,
      accountAgeYears: 3,
      reposActiveIn: 30,
    });
    expect(s).toBeGreaterThan(10);
  });

  it("does NOT trigger bot detection when merge rate >= 5%", () => {
    const s = score({
      totalPRs: 100,
      mergedPRs: 5,
      accountAgeYears: 3,
      reposActiveIn: 45,
    });
    expect(s).toBeGreaterThan(10);
  });

  // --- Bayesian smoothing (One-Hit Wonder fix) ---

  it("prevents one-hit-wonder exploit: 1 PR / 1 merged / new account scores below 45", () => {
    const s = score({
      totalPRs: 1,
      mergedPRs: 1,
      accountAgeYears: 0.001,
    });
    expect(s).toBeLessThan(45);
  });

  it("Bayesian prior is negligible at 20+ PRs", () => {
    const withPrior = score({
      totalPRs: 20,
      mergedPRs: 20,
      accountAgeYears: 3,
      reposActiveIn: 5,
    });
    // At 20 PRs with 100% merge, Bayesian smoothed ratio = (20+2.5)/(20+5) = 0.9
    // Without Bayesian it would be 1.0 -> mergeScore=100
    // With Bayesian mergeScore=90. Difference is small -> prior is mostly washed out.
    // Score should still be solidly above the one-hit-wonder range.
    expect(withPrior).toBeGreaterThan(65);
  });

  // --- Velocity penalty (ATO fix) ---

  it("applies velocity penalty for suspicious burst activity", () => {
    const normal = score({
      totalPRs: 50,
      mergedPRs: 45,
      accountAgeYears: 6,
      reposActiveIn: 10,
      recentEventCount: 0,
    });
    const burst = score({
      totalPRs: 50,
      mergedPRs: 45,
      accountAgeYears: 6,
      reposActiveIn: 10,
      recentEventCount: 20,
    });
    expect(burst).toBeLessThan(normal);
    expect(normal - burst).toBeGreaterThan(10);
  });

  it("does NOT apply velocity penalty when spike ratio is under 5x", () => {
    // 50 PRs over 1 year = ~0.137/day, baseline floored to 0.5
    // 2 events in 24h = spikeRatio 4x -> no penalty
    const withEvents = score({
      totalPRs: 50,
      mergedPRs: 45,
      accountAgeYears: 1,
      reposActiveIn: 5,
      recentEventCount: 2,
    });
    const withoutEvents = score({
      totalPRs: 50,
      mergedPRs: 45,
      accountAgeYears: 1,
      reposActiveIn: 5,
      recentEventCount: 0,
    });
    expect(withEvents).toBe(withoutEvents);
  });

  it("velocity penalty can halve the score at extreme spike", () => {
    const normal = score({
      totalPRs: 50,
      mergedPRs: 45,
      accountAgeYears: 6,
      reposActiveIn: 8,
      recentEventCount: 0,
    });
    const extreme = score({
      totalPRs: 50,
      mergedPRs: 45,
      accountAgeYears: 6,
      reposActiveIn: 8,
      recentEventCount: 50,
    });
    expect(extreme).toBeLessThanOrEqual(Math.ceil(normal / 2) + 1);
  });

  // --- Score bounds ---

  it("always returns an integer", () => {
    for (const prs of [0, 1, 5, 20, 100]) {
      for (const age of [0, 0.5, 3, 10]) {
        const s = score({
          totalPRs: prs,
          mergedPRs: Math.floor(prs * 0.7),
          accountAgeYears: age,
          reposActiveIn: 3,
        });
        expect(Number.isInteger(s)).toBe(true);
      }
    }
  });

  it("always returns a value between 0 and 100", () => {
    const extremes: Partial<ScoreInputs>[] = [
      {},
      { totalPRs: 10000, mergedPRs: 10000, accountAgeYears: 20, reposActiveIn: 100 },
      { totalPRs: 10000, mergedPRs: 0, accountAgeYears: 0, reposActiveIn: 100 },
      { totalPRs: 1, mergedPRs: 1, accountAgeYears: 0.001, recentEventCount: 1000 },
    ];
    for (const inputs of extremes) {
      const s = score(inputs);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  // --- Component weights ---

  it("healthy contributor (80% merge, 3yr, 40 merged, 8 repos) scores 65-80", () => {
    const s = score({
      totalPRs: 50,
      mergedPRs: 40,
      accountAgeYears: 3,
      reposActiveIn: 8,
    });
    expect(s).toBeGreaterThanOrEqual(65);
    expect(s).toBeLessThanOrEqual(80);
  });

  // --- Zero state ---

  it("zero-state (no PRs, no age) yields a low score based on Bayesian prior", () => {
    const s = score({});
    // smoothedMergeRatio = 2.5/5 = 0.5, mergeScore = 50
    // ageScore = 0, volumeScore = 0, spreadPenalty = 0
    // raw = 50*0.4 = 20
    expect(s).toBe(20);
  });

  // --- Spread penalty ---

  it("spread penalty triggers when repos > 10 and merge < 30%", () => {
    const lowSpread = score({
      totalPRs: 100,
      mergedPRs: 20,
      accountAgeYears: 3,
      reposActiveIn: 5,
    });
    const highSpread = score({
      totalPRs: 100,
      mergedPRs: 20,
      accountAgeYears: 3,
      reposActiveIn: 25,
    });
    expect(highSpread).toBeLessThan(lowSpread);
  });

  it("spread penalty does NOT trigger when merge rate >= 30%", () => {
    const lowSpread = score({
      totalPRs: 100,
      mergedPRs: 35,
      accountAgeYears: 3,
      reposActiveIn: 5,
    });
    const highSpread = score({
      totalPRs: 100,
      mergedPRs: 35,
      accountAgeYears: 3,
      reposActiveIn: 25,
    });
    expect(highSpread).toBe(lowSpread);
  });

  it("spread penalty does NOT trigger when repos <= 10", () => {
    const s1 = score({
      totalPRs: 100,
      mergedPRs: 10,
      accountAgeYears: 3,
      reposActiveIn: 10,
    });
    const s2 = score({
      totalPRs: 100,
      mergedPRs: 10,
      accountAgeYears: 3,
      reposActiveIn: 5,
    });
    expect(s1).toBe(s2);
  });
});
