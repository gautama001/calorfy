import { DIET_GUIDES, DIET_RECIPES } from '@/lib/dietCatalog';
import { catalogLanguage, localizeDietGuides, localizeDietRecipes } from '@/lib/dietCatalogLocale';

describe('localized diet catalog', () => {
  it('normalizes regional language codes', () => {
    expect(catalogLanguage('en-US')).toBe('en');
    expect(catalogLanguage('pt-BR')).toBe('pt');
    expect(catalogLanguage('fr')).toBe('es');
  });

  it.each(['en', 'pt'] as const)('localizes every guide and recipe in %s', (language) => {
    const guides = localizeDietGuides(DIET_GUIDES, language);
    const recipes = localizeDietRecipes(DIET_RECIPES, language);
    expect(guides).toHaveLength(10);
    expect(recipes).toHaveLength(80);
    guides.forEach((guide, index) => {
      expect(guide.name).toBeTruthy();
      expect(guide.description).not.toBe(DIET_GUIDES[index].description);
      expect(guide.principles.length).toBeGreaterThan(0);
    });
    recipes.forEach((recipe, index) => {
      expect(recipe.name).not.toBe(DIET_RECIPES[index].name);
      expect(recipe.summary).toBeTruthy();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.instructions).toHaveLength(3);
    });
  });
});
