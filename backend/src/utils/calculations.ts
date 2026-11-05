/**
 * Manufacturing metric calculation utilities for automotive production lines.
 */

/**
 * Calculates Target Achievement Rate as a percentage.
 * Formula: (actual / planned) * 100
 */
export function calculateAchievementRate(actual: number, planned: number): number {
  if (planned <= 0) return 0;
  const rate = (actual / planned) * 100;
  return Number(rate.toFixed(2));
}

/**
 * Calculates Scrap Rate as a percentage of total units attempted.
 * Formula: (scrap / (actual + scrap)) * 100
 */
export function calculateScrapRate(actual: number, scrap: number): number {
  const total = actual + scrap;
  if (total <= 0) return 0;
  const rate = (scrap / total) * 100;
  return Number(rate.toFixed(2));
}

/**
 * Calculates First Time Yield (FTY) percentage.
 * Formula: (actual / (actual + scrap)) * 100
 */
export function calculateYieldRate(actual: number, scrap: number): number {
  const total = actual + scrap;
  if (total <= 0) return 100;
  const yieldPct = (actual / total) * 100;
  return Number(yieldPct.toFixed(2));
}

/**
 * Calculates Availability percentage based on planned shift time and downtime minutes.
 * Formula: (Operating Time / Planned Production Time) * 100
 */
export function calculateAvailability(
  plannedShiftMinutes: number,
  downtimeMinutes: number
): number {
  if (plannedShiftMinutes <= 0) return 0;
  const operatingMinutes = Math.max(0, plannedShiftMinutes - downtimeMinutes);
  const availability = (operatingMinutes / plannedShiftMinutes) * 100;
  return Math.min(100, Math.max(0, Number(availability.toFixed(2))));
}

/**
 * Calculates Performance percentage.
 * Formula: ((Ideal Cycle Time in seconds * Total Count) / (Operating Time in seconds)) * 100
 */
export function calculatePerformance(
  idealCycleTimeSeconds: number,
  totalCount: number,
  operatingMinutes: number
): number {
  const operatingSeconds = operatingMinutes * 60;
  if (operatingSeconds <= 0 || idealCycleTimeSeconds <= 0 || totalCount <= 0) return 0;
  const perf = ((idealCycleTimeSeconds * totalCount) / operatingSeconds) * 100;
  return Math.min(100, Math.max(0, Number(perf.toFixed(2))));
}

/**
 * Calculates Quality percentage.
 * Formula: (Good Count / Total Count) * 100
 */
export function calculateQuality(goodCount: number, totalCount: number): number {
  if (totalCount <= 0) return 100;
  const quality = (goodCount / totalCount) * 100;
  return Math.min(100, Math.max(0, Number(quality.toFixed(2))));
}

/**
 * Calculates Overall Equipment Effectiveness (OEE) score.
 * Formula: (Availability * Performance * Quality) / 10000 (when components are given in percentages 0-100)
 */
export function calculateOee(
  availabilityPct: number,
  performancePct: number,
  qualityPct: number
): number {
  if (availabilityPct <= 0 || performancePct <= 0 || qualityPct <= 0) return 0;
  const clampedAvailability = Math.min(100, Math.max(0, availabilityPct));
  const clampedPerformance = Math.min(100, Math.max(0, performancePct));
  const clampedQuality = Math.min(100, Math.max(0, qualityPct));

  const oee = (clampedAvailability * clampedPerformance * clampedQuality) / 10000;
  return Number(oee.toFixed(2));
}

/**
 * Industrial OEE Calculation breakdown.
 */
export function calculateIndustrialOee(params: {
  plannedMinutes: number;
  downtimeMinutes: number;
  idealCycleTimeSeconds: number;
  totalCount: number;
  goodCount: number;
}): {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
} {
  const operatingMinutes = Math.max(0, params.plannedMinutes - params.downtimeMinutes);
  const availability = calculateAvailability(params.plannedMinutes, params.downtimeMinutes);
  const performance = calculatePerformance(params.idealCycleTimeSeconds, params.totalCount, operatingMinutes);
  const quality = calculateQuality(params.goodCount, params.totalCount);
  const oee = calculateOee(availability, performance, quality);

  return { availability, performance, quality, oee };
}
