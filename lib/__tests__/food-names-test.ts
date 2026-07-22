import { simplifyFoodList, simplifyFoodName } from '@/lib/foodNames';

describe('food display names', () => {
  it('removes scientific and geographic source details', () => {
    expect(simplifyFoodName(
      'Frijol, negro, crudo, Phaseolus vulgaris Ojo de Agua, Santa Lucía, Cotzumalguapa - Guatemala',
    )).toBe('Frijol, negro, crudo');
  });

  it('keeps preparation and relevant food descriptors', () => {
    expect(simplifyFoodName(
      'Carne, bovina, cuarto delantero, bife ancho, sin hueso, sin grasa, cruda, Bos taurus, Jujuy - Argentina',
    )).toBe('Carne, bovina, cuarto delantero, bife ancho, sin hueso, sin grasa, cruda');
  });

  it('does not shorten ordinary names', () => {
    expect(simplifyFoodName('Papa andina, con cáscara, hervida, sin sal')).toBe('Papa andina, con cáscara, hervida, sin sal');
    expect(simplifyFoodName('Palta / Aguacate')).toBe('Palta / Aguacate');
  });

  it('removes a country suffix even without taxonomy', () => {
    expect(simplifyFoodName('Sorgo, harina, Argentina')).toBe('Sorgo, harina');
  });

  it('keeps only the best-positioned entry when simplified names collide', () => {
    expect(simplifyFoodList([
      { id: 'best', display_name: 'Frijol, negro, crudo, Phaseolus vulgaris, Guatemala' },
      { id: 'duplicate', display_name: 'Frijol, negro, crudo, Phaseolus vulgaris, México' },
      { id: 'other', display_name: 'Frijol, rojo, crudo, Phaseolus vulgaris, México' },
    ])).toEqual([
      { id: 'best', display_name: 'Frijol, negro, crudo' },
      { id: 'other', display_name: 'Frijol, rojo, crudo' },
    ]);
  });
});
