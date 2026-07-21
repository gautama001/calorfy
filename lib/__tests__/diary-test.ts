jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { createDiaryClientEventId, diaryMealToInputs, type DiaryMeal } from '@/lib/diary';

describe('diary idempotency keys', () => {
  it('creates unique UUIDs accepted by Postgres', () => {
    const first = createDiaryClientEventId();
    const second = createDiaryClientEventId();
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(first).toMatch(uuid);
    expect(second).toMatch(uuid);
    expect(second).not.toBe(first);
  });
});

describe('repeating meals', () => {
  it('preserves the original quantities and nutrient snapshots', () => {
    const meal: DiaryMeal = {
      id: 'meal-1',
      name: 'Almuerzo habitual',
      category: 'lunch',
      calories: 240,
      protein: 12,
      carbs: 30,
      fat: 8,
      image: null,
      date: '2026-07-20',
      timestamp: '2026-07-20T15:00:00.000Z',
      isFavorite: true,
      synced: true,
      items: [{
        id: 'item-1',
        foodId: 'food-1',
        name: 'Guiso de lentejas',
        quantity: 250,
        unit: 'g',
        grams: 250,
        calories: 240,
        protein: 12,
        carbs: 30,
        fat: 8,
      }],
    };

    expect(diaryMealToInputs(meal)).toEqual([expect.objectContaining({
      quantity: 250,
      grams: 250,
      calories: 240,
      protein: 12,
      carbs: 30,
      fat: 8,
      food: expect.objectContaining({ display_name: 'Guiso de lentejas', energy_kcal: 96 }),
    })]);
  });
});
