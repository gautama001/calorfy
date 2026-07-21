import type { FoodSearchResult } from '@/lib/catalog';

export type PortionUnit = 'g' | 'ml' | 'tbsp';

type UnitFood = Pick<FoodSearchResult, 'display_name' | 'group_code'>;

function startsWithTerm(name: string, terms: string[]) {
  return terms.some((term) => name === term || name.startsWith(`${term} `) || name.startsWith(`${term},`));
}

export function inferPortionUnit(food: UnitFood): PortionUnit {
  const group = food.group_code?.trim().toUpperCase();
  const name = food.display_name.trim().toLocaleLowerCase('es');

  // The catalog group is stronger evidence than words buried in a long
  // description (for example the place name "Ojo de Agua" on a bean record).
  if (group === 'BEVERAGES') return 'ml';
  if (group === 'CONDIMENTS') return 'tbsp';

  if (
    startsWithTerm(name, [
      'agua',
      'bebida',
      'café',
      'cafe',
      'gaseosa',
      'jugo',
      'leche',
      'refresco',
      'té',
      'te',
      'zumo',
    ])
  ) {
    return 'ml';
  }

  if (startsWithTerm(name, ['aceite', 'aderezo', 'mayonesa', 'mostaza', 'salsa'])) {
    return 'tbsp';
  }

  return 'g';
}
