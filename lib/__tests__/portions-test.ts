import { inferPortionUnit } from '@/lib/portions';

describe('inferPortionUnit', () => {
  it('does not confuse a place containing Agua with a beverage', () => {
    expect(
      inferPortionUnit({
        display_name: 'Frijol, negro, crudo, Phaseolus vulgaris Ojo de Agua, Santa Lucía, Cotzumalguapa - Guatemala',
        group_code: 'LEGUMES',
      })
    ).toBe('g');
  });

  it('uses milliliters for beverages and liquid names', () => {
    expect(inferPortionUnit({ display_name: 'Café preparado', group_code: 'BEVERAGES' })).toBe('ml');
    expect(inferPortionUnit({ display_name: 'Leche entera', group_code: 'DAIRY' })).toBe('ml');
  });

  it('does not match short fragments inside unrelated food names', () => {
    expect(inferPortionUnit({ display_name: 'Arroz con leche', group_code: 'CEREALS' })).toBe('g');
    expect(inferPortionUnit({ display_name: 'Batata', group_code: 'VEGETABLES' })).toBe('g');
  });

  it('uses tablespoons for condiments and oils', () => {
    expect(inferPortionUnit({ display_name: 'Salsa criolla', group_code: 'CONDIMENTS' })).toBe('tbsp');
    expect(inferPortionUnit({ display_name: 'Aceite de oliva', group_code: 'FATS' })).toBe('tbsp');
  });
});
