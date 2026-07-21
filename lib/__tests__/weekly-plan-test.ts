jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { getDietRecipe } from '@/lib/dietCatalog';
import {
  currentWeekStart,
  generateWeeklyPlanItems,
  goalDietToCatalogDiet,
  recipeServingToDiaryInput,
} from '@/lib/weeklyPlan';

describe('weekly meal planning', () => {
  it('starts weeks on Monday using local calendar dates', () => {
    expect(currentWeekStart(new Date(2026, 6, 20, 8))).toBe('2026-07-20');
    expect(currentWeekStart(new Date(2026, 6, 26, 23))).toBe('2026-07-20');
  });

  it('generates four meals for each of seven days', () => {
    const items = generateWeeklyPlanItems('2026-07-20', 'latam_balanced', 2000);
    expect(items).toHaveLength(28);
    expect(new Set(items.map((item) => `${item.plan_date}:${item.category}`)).size).toBe(28);
    expect(new Set(items.map((item) => item.plan_date)).size).toBe(7);
  });

  it('scales each day close to the calorie target', () => {
    const items = generateWeeklyPlanItems('2026-07-20', 'mediterranean', 1800);
    const firstDayCalories = items
      .filter((item) => item.plan_date === '2026-07-20')
      .reduce((sum, item) => sum + (getDietRecipe(item.recipe_id)?.calories ?? 0) * item.servings, 0);
    expect(firstDayCalories).toBeGreaterThan(1500);
    expect(firstDayCalories).toBeLessThan(2100);
  });

  it('maps profile preferences and preserves scaled recipe nutrition', () => {
    expect(goalDietToCatalogDiet('balanced')).toBe('latam_balanced');
    expect(goalDietToCatalogDiet('raw')).toBe('vegan');
    const recipe = getDietRecipe('latam_balanced-1');
    expect(recipe).toBeDefined();
    const input = recipeServingToDiaryInput(recipe!, 1.5);
    expect(input.grams).toBe(recipe!.servingGrams * 1.5);
    expect(input.calories).toBe(recipe!.calories * 1.5);
  });
});
