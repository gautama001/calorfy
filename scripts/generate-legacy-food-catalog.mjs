import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourcePath = resolve(process.argv[2] ?? 'data/catalog/legacy-foods-v1.json');
const dataPath = resolve('data/catalog/legacy-foods-v1.json');
const migrationPath = resolve('supabase/migrations/202607200003_seed_legacy_food_catalog.sql');

const slugify = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_|_$/g, '');

const groups = {
  MEAT: ['asado_tira', 'vacio', 'entrana', 'chorizo', 'morcilla', 'bife_chorizo', 'pollo_asado', 'pollo_plancha', 'cerdo', 'tocino_cocido', 'pechuga_pollo', 'muslo_pollo', 'churrasco'],
  PREPARED: ['empanada_carne_horno', 'empanada_frita', 'milanesa', 'plato_paisa', 'tacos_carne', 'tacos_pollo', 'arepas', 'choripan', 'hamburguesa_casera', 'pizza_porcion', 'pastel_papa', 'guiso', 'arroz_pollo', 'panqueque_dulce_leche', 'pollo_frito', 'feijoada', 'ceviche', 'pabellon', 'bandeja_paisa', 'ajiaco', 'locro', 'carbonada', 'mondongo', 'sancocho', 'ensalada_mixta', 'sopa_verduras', 'caldo_pollo', 'tortilla_espanola'],
  CEREALS: ['papas_fritas', 'papas_horno', 'pure_papas', 'arroz_blanco', 'fideos_cocidos', 'pan_blanco', 'pan_integral', 'panqueque_simple', 'avena', 'quinoa_cocida', 'maiz_cocido', 'papas_chips'],
  LEGUMES: ['lentejas', 'frijoles_negros', 'frijoles_rojos', 'garbanzos', 'porotos', 'hummus'],
  VEGETABLES: ['tomate', 'lechuga', 'cebolla', 'zanahoria', 'brocoli', 'espinaca'],
  FRUITS: ['banana', 'manzana', 'naranja', 'palta', 'mango', 'papaya', 'pina'],
  FISH: ['pescado_frito', 'atun_lata', 'salmon'],
  DAIRY: ['queso_generico', 'leche_entera', 'leche_descremada', 'yogur_natural', 'queso_crema', 'queso_mozzarella'],
  EGGS: ['huevo_entero', 'huevo_duro', 'huevos_revueltos', 'huevos_fritos'],
  FATS: ['aceite_vegetal', 'mantequilla'],
  SWEETS: ['helado_crema', 'helado_chocolate', 'helado_artesanal', 'dulce_leche', 'torta_simple', 'galletas', 'chocolate', 'flan', 'tres_leches', 'alfajor', 'churros'],
  BEVERAGES: ['agua', 'jugo_naranja', 'cafe', 'mate'],
  OTHER: ['mani', 'almendras', 'nueces'],
};

const groupById = new Map(Object.entries(groups).flatMap(([group, ids]) => ids.map((id) => [id, group])));

const presence = {
  asado_tira: ['AR', 'UY'], vacio: ['AR', 'UY'], entrana: ['AR', 'UY'], bife_chorizo: ['AR'],
  empanada_carne_horno: ['AR', 'BO', 'CL', 'CO', 'EC', 'PY', 'PE', 'UY', 'VE'],
  empanada_frita: ['AR', 'BO', 'CL', 'CO', 'EC', 'PY', 'PE', 'UY', 'VE'],
  milanesa: ['AR', 'PY', 'UY'], plato_paisa: ['CO'], bandeja_paisa: ['CO'],
  tacos_carne: ['MX'], tacos_pollo: ['MX'], arepas: ['VE', 'CO'], choripan: ['AR', 'UY'],
  pastel_papa: ['AR', 'CL', 'PE'], arroz_pollo: ['CO', 'CR', 'CU', 'DO', 'EC', 'PA', 'PE', 'PR'],
  feijoada: ['BR'], ceviche: ['PE', 'EC'], pabellon: ['VE'], ajiaco: ['CO'], locro: ['AR', 'BO', 'EC', 'PE'],
  carbonada: ['AR', 'CL'], mondongo: ['AR', 'CO', 'DO', 'PA', 'VE'], sancocho: ['CO', 'DO', 'PA', 'PR', 'VE'],
  churrasco: ['BR', 'AR', 'UY'], dulce_leche: ['AR', 'UY'], mate: ['AR', 'PY', 'UY', 'BR'],
  alfajor: ['AR', 'PE', 'UY'], tres_leches: ['MX', 'NI', 'CR'],
};

const traditionalIds = new Set(Object.keys(presence));
const processedIds = new Set([
  'chorizo', 'morcilla', 'tocino_cocido', 'pan_blanco', 'pan_integral', 'queso_generico',
  'aceite_vegetal', 'helado_crema', 'helado_chocolate', 'helado_artesanal', 'galletas',
  'chocolate', 'atun_lata', 'leche_descremada', 'yogur_natural', 'queso_crema',
  'queso_mozzarella', 'mantequilla', 'papas_chips',
]);

const raw = JSON.parse(await readFile(sourcePath, 'utf8'));
if (!Array.isArray(raw) || raw.length < 100) throw new Error('Expected at least 100 legacy foods.');

const seen = new Set();
const foods = raw.map((food) => {
  const sourceId = slugify(food.id);
  if (!sourceId || seen.has(sourceId)) throw new Error(`Invalid or duplicate food id: ${food.id}`);
  seen.add(sourceId);
  const groupCode = groupById.get(sourceId);
  if (!groupCode) throw new Error(`Food has no group mapping: ${sourceId}`);
  for (const field of ['calories', 'protein', 'carbs', 'fat']) {
    if (!Number.isFinite(food[field]) || food[field] < 0) throw new Error(`Invalid ${field} for ${sourceId}`);
  }
  const countries = presence[sourceId] ?? [];
  return {
    source_id: sourceId,
    names: food.names,
    energy_kcal: food.calories,
    protein_g: food.protein,
    carbohydrate_g: food.carbs,
    fat_g: food.fat,
    legacy_source: food.source,
    group_code: groupCode,
    food_type: traditionalIds.has(sourceId) ? 'traditional_dish' : processedIds.has(sourceId) ? 'processed' : groupCode === 'PREPARED' ? 'prepared' : 'generic',
    origin_country_code: countries[0] ?? null,
    country_codes: countries,
    confidence: /USDA FoodData Central/i.test(food.source) ? 3 : 2,
  };
});

await mkdir(dirname(dataPath), { recursive: true });
await writeFile(dataPath, `${JSON.stringify(foods, null, 2)}\n`, 'utf8');

const json = JSON.stringify(foods);
const sql = `-- Generated by scripts/generate-legacy-food-catalog.mjs.
-- Values are the historical Calorfy estimates per 100 g. They are available
-- for beta search, but retain review metadata until each source is audited.

do $seed$
declare
  legacy_source_id uuid;
  legacy_food_id uuid;
  item record;
  country text;
begin
  insert into public.catalog_sources (
    name, publisher, version, usage_status, attribution_text, import_notes, metadata
  ) values (
    'Calorfy legacy nutrition catalog',
    'Calorfy',
    '1.0.0',
    'internal',
    'Historical Calorfy catalog compiled from USDA, FAO and regional recipe estimates.',
    'Beta seed. Audit original source rows before assigning quality grade A or B.',
    '{"review_required":true,"basis":"values_per_100g"}'::jsonb
  )
  on conflict (name, version) do update set
    import_notes = excluded.import_notes,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into legacy_source_id;

  for item in
    select * from jsonb_to_recordset($catalog$${json}$catalog$::jsonb) as x(
      source_id text,
      names jsonb,
      energy_kcal numeric,
      protein_g numeric,
      carbohydrate_g numeric,
      fat_g numeric,
      legacy_source text,
      group_code text,
      food_type text,
      origin_country_code text,
      country_codes jsonb,
      confidence smallint
    )
  loop
    insert into public.foods (
      canonical_name, food_type, group_code, origin_country_code, source_id,
      source_food_code, verification_status, quality_grade, default_portion_g,
      tags, metadata, verified_at
    ) values (
      item.names ->> 'es', item.food_type, item.group_code, item.origin_country_code,
      legacy_source_id, item.source_id, 'verified', 'C', 100,
      array['legacy-v1', 'latam'],
      jsonb_build_object(
        'legacy_source', item.legacy_source,
        'review_required', true,
        'nutrient_basis', 'per_100g'
      ),
      now()
    )
    on conflict (source_id, source_food_code) do update set
      canonical_name = excluded.canonical_name,
      food_type = excluded.food_type,
      group_code = excluded.group_code,
      origin_country_code = excluded.origin_country_code,
      verification_status = excluded.verification_status,
      quality_grade = excluded.quality_grade,
      metadata = excluded.metadata,
      updated_at = now()
    returning id into legacy_food_id;

    insert into public.food_names (food_id, locale, name, name_type)
    values
      (legacy_food_id, 'es', item.names ->> 'es', 'primary'),
      (legacy_food_id, 'en', item.names ->> 'en', 'common'),
      (legacy_food_id, 'pt', item.names ->> 'pt', 'common')
    on conflict do nothing;

    insert into public.food_nutrients (
      food_id, nutrient_code, amount_per_100g, value_type, source_id, confidence, notes
    ) values
      (legacy_food_id, 'energy_kcal', item.energy_kcal, 'estimated', legacy_source_id, item.confidence, item.legacy_source),
      (legacy_food_id, 'protein', item.protein_g, 'estimated', legacy_source_id, item.confidence, item.legacy_source),
      (legacy_food_id, 'carbohydrate', item.carbohydrate_g, 'estimated', legacy_source_id, item.confidence, item.legacy_source),
      (legacy_food_id, 'fat_total', item.fat_g, 'estimated', legacy_source_id, item.confidence, item.legacy_source)
    on conflict (food_id, nutrient_code) do update set
      amount_per_100g = excluded.amount_per_100g,
      value_type = excluded.value_type,
      source_id = excluded.source_id,
      confidence = excluded.confidence,
      notes = excluded.notes,
      updated_at = now();

    insert into public.food_portions (
      food_id, locale, label, grams, source_id, is_default
    )
    select legacy_food_id, 'es', '100 g', 100, legacy_source_id, true
    where not exists (
      select 1 from public.food_portions
      where food_id = legacy_food_id and locale = 'es' and grams = 100
    );

    for country in select jsonb_array_elements_text(item.country_codes)
    loop
      insert into public.food_country_presence (
        food_id, country_code, popularity, is_traditional
      ) values (legacy_food_id, country, 4, true)
      on conflict (food_id, country_code) do update set
        popularity = excluded.popularity,
        is_traditional = excluded.is_traditional;
    end loop;
  end loop;
end
$seed$;
`;

await writeFile(migrationPath, sql, 'utf8');
console.log(`Generated ${foods.length} foods in ${dataPath} and ${migrationPath}`);
