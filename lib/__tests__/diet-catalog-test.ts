import { DIET_GUIDES, DIET_RECIPES, getDietRecipes } from '@/lib/dietCatalog';

describe('diet recipe catalog', () => {
  it('offers a substantial and unique recipe library', () => {
    expect(DIET_GUIDES).toHaveLength(10);
    expect(DIET_RECIPES).toHaveLength(80);
    expect(new Set(DIET_RECIPES.map((recipe) => recipe.id)).size).toBe(DIET_RECIPES.length);
  });

  it('gives every diet two recipes for every diary category', () => {
    for (const diet of DIET_GUIDES) {
      const recipes = getDietRecipes(diet.key);
      for (const category of ['breakfast', 'lunch', 'snack', 'dinner']) {
        expect(recipes.filter((recipe) => recipe.category === category)).toHaveLength(2);
      }
    }
  });

  it('contains complete nutrition and preparation data', () => {
    for (const recipe of DIET_RECIPES) {
      expect(recipe.calories).toBeGreaterThan(0);
      expect(recipe.servingGrams).toBeGreaterThan(0);
      expect(recipe.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(recipe.instructions.length).toBeGreaterThanOrEqual(3);
    }
  });
});
