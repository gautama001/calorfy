jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { calculateEnergyRecommendation, calculateMacroRecommendation, calculateWeightProgress, isGoalProfileComplete, normalizeLegacyGoal, normalizeLegacySex } from '@/lib/goals';

describe('goal onboarding', () => {
  const completeProfile = {
    currentWeightKg: 80, targetWeightKg: 72, startingWeightKg: 80, goalStartedOn: '2026-07-21',
    heightCm: 175, birthYear: 1990, sex: 'male' as const, goal: 'lose' as const, diet: 'balanced' as const,
    calorieGoal: 1900, proteinGoalG: 128, carbsGoalG: 190, fatGoalG: 70,
  };

  it('only treats a nutritionally configured profile as complete', () => {
    expect(isGoalProfileComplete(completeProfile)).toBe(true);
    expect(isGoalProfileComplete({ ...completeProfile, heightCm: null })).toBe(false);
    expect(isGoalProfileComplete(null)).toBe(false);
  });
});

describe('macro recommendations', () => {
  it('raises protein for a configured weight-loss goal', () => {
    const result = calculateMacroRecommendation({ calories: 2000, weightKg: 100, goal: 'lose', diet: 'balanced' });
    expect(result.protein).toBe(160);
    expect(result.fats).toBe(67);
    expect(result.carbs).toBe(189);
  });

  it('keeps carbohydrates low for a ketogenic preference', () => {
    const result = calculateMacroRecommendation({ calories: 2000, weightKg: 80, goal: 'maintain', diet: 'keto' });
    expect(result.protein).toBe(96);
    expect(result.carbs).toBe(40);
    expect(result.fats).toBe(162);
  });

  it('separates resting needs, sedentary maintenance and BMI-based deficit', () => {
    const result = calculateEnergyRecommendation({ weightKg: 100, heightCm: 180, age: 30, sex: 'male', goal: 'lose' });
    expect(result.restingCalories).toBe(1980);
    expect(result.sedentaryCalories).toBe(2376);
    expect(result.adjustmentCalories).toBe(-475);
    expect(result.targetCalories).toBe(1901);
    expect(result.bmi).toBeCloseTo(30.86, 1);
  });

  it('uses a safe calorie-based fallback without a recorded weight', () => {
    const result = calculateMacroRecommendation({ calories: 1800, weightKg: null, goal: null, diet: 'mediterranean' });
    expect(result.protein).toBe(113);
    expect(result.proteinPercent + result.carbsPercent + result.fatsPercent).toBeGreaterThanOrEqual(99);
  });
});

describe('legacy goal migration', () => {
  it('maps old UI values to database enums', () => {
    expect(normalizeLegacyGoal('muscle')).toBe('gain_muscle');
    expect(normalizeLegacyGoal('lose')).toBe('lose');
    expect(normalizeLegacyGoal('unknown')).toBeNull();
  });

  it('normalizes Spanish and abbreviated sex values', () => {
    expect(normalizeLegacySex('m')).toBe('male');
    expect(normalizeLegacySex('Femenino')).toBe('female');
    expect(normalizeLegacySex('otro')).toBe('other');
  });
});

describe('weight progress', () => {
  it('calculates a weight-loss journey and the seven-day change', () => {
    const result = calculateWeightProgress([
      { date: '2026-07-01', weight: 90 },
      { date: '2026-07-10', weight: 87 },
      { date: '2026-07-20', weight: 85 },
    ], 80);

    expect(result.progress).toBe(0.5);
    expect(result.totalChange).toBe(-5);
    expect(result.weeklyChange).toBe(-2);
    expect(result.remaining).toBe(5);
  });

  it('supports weight gain and clamps progress before the starting point', () => {
    expect(calculateWeightProgress([
      { date: '2026-07-01', weight: 60 },
      { date: '2026-07-20', weight: 65 },
    ], 70).progress).toBe(0.5);
    expect(calculateWeightProgress([
      { date: '2026-07-01', weight: 60 },
      { date: '2026-07-20', weight: 58 },
    ], 70).progress).toBe(0);
  });

  it('keeps the persisted cycle baseline when older chart points are trimmed', () => {
    const result = calculateWeightProgress(
      [{ date: '2026-07-20', weight: 85 }],
      80,
      85,
      100,
      '2026-01-01',
    );

    expect(result.startWeight).toBe(100);
    expect(result.totalChange).toBe(-15);
    expect(result.progress).toBe(0.75);
  });

  it('prioritizes the confirmed profile weight over stale cached history', () => {
    const result = calculateWeightProgress(
      [{ date: '2026-07-20', weight: 100 }],
      80,
      95,
      105,
      '2026-07-01',
    );

    expect(result.currentWeight).toBe(95);
    expect(result.totalChange).toBe(-10);
    expect(result.progress).toBe(0.4);
  });
});
