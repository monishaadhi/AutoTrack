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
 * Calculates Availability percentage based on planned shift time and downtime minutes.
 */
export function calculateAvailability(
  plannedShiftMinutes: number,
  downtimeMinutes: number
): number {
  if (plannedShiftMinutes <= 0) return 0;
  const operatingMinutes = Math.max(0, plannedShiftMinutes - downtimeMinutes);
  const availability = (operatingMinutes / plannedShiftMinutes) * 100;
  return Number(availability.toFixed(2));
}
