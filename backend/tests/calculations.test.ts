import { describe, it, expect } from 'vitest';
import {
  calculateAchievementRate,
  calculateScrapRate,
  calculateYieldRate,
  calculateOee,
  calculateAvailability,
} from '../src/utils/calculations';

describe('Manufacturing Metric Calculations', () => {
  describe('calculateAchievementRate', () => {
    it('calculates target achievement percentage accurately', () => {
      expect(calculateAchievementRate(342, 360)).toBe(95.0);
      expect(calculateAchievementRate(400, 400)).toBe(100.0);
    });

    it('handles edge case when planned units is zero or negative', () => {
      expect(calculateAchievementRate(100, 0)).toBe(0);
      expect(calculateAchievementRate(100, -50)).toBe(0);
    });

    it('correctly handles overproduction (>100%)', () => {
      expect(calculateAchievementRate(420, 400)).toBe(105.0);
    });
  });

  describe('calculateScrapRate', () => {
    it('calculates scrap rate percentage accurately', () => {
      // 6 scrap out of (342 actual + 6 scrap = 348 total) -> 1.72%
      expect(calculateScrapRate(342, 6)).toBe(1.72);
    });

    it('returns 0 when total units is zero', () => {
      expect(calculateScrapRate(0, 0)).toBe(0);
    });
  });

  describe('calculateYieldRate', () => {
    it('calculates first-time yield rate accurately', () => {
      // 342 good / 348 total -> 98.28%
      expect(calculateYieldRate(342, 6)).toBe(98.28);
    });

    it('returns 100% when no units attempted', () => {
      expect(calculateYieldRate(0, 0)).toBe(100);
    });
  });

  describe('calculateOee', () => {
    it('multiplies Availability, Performance, and Quality correctly', () => {
      // 90% Availability, 95% Performance, 98% Quality -> (90 * 95 * 98) / 10000 = 83.79%
      expect(calculateOee(90, 95, 98)).toBe(83.79);
    });

    it('returns 0 if any component is 0 or negative', () => {
      expect(calculateOee(0, 95, 98)).toBe(0);
      expect(calculateOee(90, -10, 98)).toBe(0);
      expect(calculateOee(90, 95, 0)).toBe(0);
    });
  });

  describe('calculateAvailability', () => {
    it('calculates operating time over planned shift time', () => {
      // 480 min shift, 48 min downtime -> (432 / 480) * 100 = 90.0%
      expect(calculateAvailability(480, 48)).toBe(90.0);
    });

    it('handles zero planned minutes', () => {
      expect(calculateAvailability(0, 10)).toBe(0);
    });

    it('clamps to 0 if downtime exceeds planned shift minutes', () => {
      expect(calculateAvailability(480, 500)).toBe(0);
    });
  });
});
