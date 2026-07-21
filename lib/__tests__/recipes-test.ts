jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { personalRecipeToInputs, type PersonalRecipe } from '@/lib/recipes';

describe('personal recipe portions', () => {
  const recipe: PersonalRecipe = {
    id: 'recipe-1',
    name: 'Empanadas caseras',
    category: 'dinner',
    yieldQuantity: 12,
    yieldLabel: 'empanadas',
    calories: 2400,
    protein: 120,
    carbs: 240,
    fat: 96,
    updatedAt: '2026-07-20T15:00:00.000Z',
    items: [{
      id: 'item-1',
      foodId: 'food-1',
      name: 'Empanada de carne',
      quantity: 12,
      unit: 'g',
      grams: 1200,
      calories: 2400,
      protein: 120,
      carbs: 240,
      fat: 96,
    }],
  };

  it('scales every ingredient to the amount consumed', () => {
    const [item] = personalRecipeToInputs(recipe, 3);
    expect(item).toEqual(expect.objectContaining({
      quantity: 3,
      grams: 300,
      calories: 600,
      protein: 30,
      carbs: 60,
      fat: 24,
    }));
  });

  it('reconstructs the complete recipe without changing its totals', () => {
    const items = personalRecipeToInputs(recipe, recipe.yieldQuantity);
    expect(items.reduce((sum, item) => sum + item.calories, 0)).toBe(recipe.calories);
    expect(items.reduce((sum, item) => sum + item.grams, 0)).toBe(1200);
  });
});
