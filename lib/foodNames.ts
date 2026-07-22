const COUNTRY_NAMES = [
  'argentina', 'bolivia', 'brasil', 'brazil', 'chile', 'colombia', 'costa rica',
  'cuba', 'ecuador', 'el salvador', 'guatemala', 'haiti', 'honduras', 'méxico',
  'mexico', 'nicaragua', 'panamá', 'panama', 'paraguay', 'perú', 'peru',
  'puerto rico', 'república dominicana', 'republica dominicana', 'uruguay',
  'venezuela',
];

const COUNTRY_PATTERN = new RegExp(`(?:^|\\s|-)(${COUNTRY_NAMES.join('|')})(?:\\s|$|\\()`, 'i');
const SCIENTIFIC_NAME_PATTERN = /^[A-Z][A-Za-z]+\s+[a-z][a-z.-]{2,}(?:\s|$)/;

function isSourceDetail(part: string, index: number) {
  const normalized = part.trim();
  if (!normalized) return false;
  if (COUNTRY_PATTERN.test(normalized)) return true;

  // LATINFOODS places taxonomy immediately before province/country metadata.
  // Requiring at least two prior descriptive segments avoids treating common
  // names such as "Papa andina" as scientific nomenclature.
  return index >= 2 && SCIENTIFIC_NAME_PATTERN.test(normalized);
}

export function simplifyFoodName(name: string) {
  const normalized = name.replace(/\s+/g, ' ').trim();
  if (!normalized) return name;

  const parts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  const detailIndex = parts.findIndex(isSourceDetail);
  const visibleParts = detailIndex >= 0 ? parts.slice(0, detailIndex) : parts;

  return visibleParts
    .join(', ')
    .replace(/\s+-\s+$/, '')
    .replace(/\s+([,.)])/g, '$1')
    .trim() || normalized;
}

export function simplifyFoodList<T extends { display_name: string }>(foods: T[], limit = 30) {
  const seenNames = new Set<string>();
  return foods
    .map((food) => ({ ...food, display_name: simplifyFoodName(food.display_name) }))
    .filter((food) => {
      const key = food.display_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    })
    .slice(0, limit);
}
