import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ROOT_URL = 'https://latinfoodsportal.net/paises';
const OUTPUT_JSON = resolve('data/catalog/latinfoods-test-v1.json');
const OUTPUT_SQL = resolve('supabase/migrations/202607200006_seed_latinfoods_test.sql');
const CONCURRENCY = 6;

const chapters = [
  { portalCode: 'ar', chapterCode: 'arg', countryCode: 'AR', label: 'Argentina' },
  { portalCode: 'br', chapterCode: 'bra', countryCode: 'BR', label: 'Brasil' },
  { portalCode: 'cl', chapterCode: 'chl', countryCode: 'CL', label: 'Chile' },
  { portalCode: 'cr', chapterCode: 'cri', countryCode: 'CR', label: 'Costa Rica' },
  { portalCode: 'gt', chapterCode: 'gtm', countryCode: 'GT', label: 'Guatemala' },
  { portalCode: 'mx', chapterCode: 'mex', countryCode: 'MX', label: 'México' },
  { portalCode: 'py', chapterCode: 'pry', countryCode: 'PY', label: 'Paraguay' },
];

const entityMap = {
  amp: '&', apos: "'", copy: '©', gt: '>', lt: '<', nbsp: ' ', quot: '"',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  acirc: 'â', ecirc: 'ê', icirc: 'î', ocirc: 'ô', ucirc: 'û',
  atilde: 'ã', otilde: 'õ', ccedil: 'ç', Ccedil: 'Ç', ntilde: 'ñ', Ntilde: 'Ñ',
  auml: 'ä', euml: 'ë', iuml: 'ï', ouml: 'ö', uuml: 'ü',
};

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&([a-z]+);/gi, (match, name) => entityMap[name] ?? match);
}

function textFromHtml(value) {
  return decodeHtml(value.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function parseNumber(value) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === '-' || normalized === 'na') return null;
  if (normalized === 'tr' || normalized === 'traza') return 0;
  const result = Number(normalized.replace(',', '.'));
  return Number.isFinite(result) && result >= 0 ? result : null;
}

function groupCode(group) {
  const value = normalize(group);
  if (value.includes('azucar') || value.includes('dulce')) return 'SWEETS';
  if (value.includes('acucar') || value.includes('doce')) return 'SWEETS';
  if (value.includes('bebida')) return 'BEVERAGES';
  if (value.includes('carne')) return 'MEAT';
  if (value.includes('cereal')) return 'CEREALS';
  if (value.includes('comida') || value.includes('fast food')) return 'PREPARED';
  if (value.includes('fruta')) return 'FRUITS';
  if (value.includes('grasa') || value.includes('aceite') || value.includes('gordura') || value.includes('oleo')) return 'FATS';
  if (value.includes('huevo') || value.includes('ovo')) return 'EGGS';
  if (value.includes('leche') || value.includes('leit')) return 'DAIRY';
  if (value.includes('legumin')) return 'LEGUMES';
  if (value.includes('nueces') || value.includes('semillas')) return 'OTHER';
  if (value.includes('pescado') || value.includes('peixe') || value.includes('mar')) return 'FISH';
  if (value.includes('vegetal') || value.includes('hortal')) return 'VEGETABLES';
  if (value.includes('industrial') || value.includes('especial')) return 'OTHER';
  return 'OTHER';
}

function parseRows(html) {
  const tbody = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] ?? '';
  return [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((rowMatch) =>
    [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => textFromHtml(cell[1])),
  ).filter((row) => row.length > 0);
}

function parseListPage(html, chapter) {
  return parseRows(html).flatMap((cells) => {
    if (!/^[A-Z0-9]+$/.test(cells[0] ?? '')) return [];
    if (chapter.countryCode === 'BR' && cells.length >= 4) {
      return [{
        code: cells[0],
        names: { es: cells[1], pt: cells[1], en: cells[2] },
        group: cells[3],
        countryCode: chapter.countryCode,
        countryLabel: chapter.label,
      }];
    }
    if (cells.length < 5) return [];
    return [{
      code: cells[0],
      names: { es: cells[1], pt: cells[2], en: cells[3] },
      group: cells[4],
      countryCode: chapter.countryCode,
      countryLabel: chapter.label,
    }];
  });
}

function maxPage(html) {
  const pages = [...html.matchAll(/pagina=(\d+)/gi)].map((match) => Number(match[1]));
  return Math.max(1, ...pages);
}

function cookieFrom(response) {
  const raw = response.headers.get('set-cookie') ?? '';
  return raw.split(';')[0];
}

async function getText(url, cookie = '') {
  const response = await fetch(url, {
    headers: cookie ? { Cookie: cookie, 'User-Agent': 'Calorfy test catalog importer/1.0' } : { 'User-Agent': 'Calorfy test catalog importer/1.0' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return { text: await response.text(), cookie: cookie || cookieFrom(response) };
}

async function mapConcurrent(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

function parseNutrients(html) {
  const values = new Map();
  for (const cells of parseRows(html)) {
    if (cells.length < 9) continue;
    const component = normalize(cells[0]);
    const unit = normalize(cells[1]);
    const amount = parseNumber(cells[2]);
    if (amount === null) continue;
    const valueType = normalize(cells[8]).includes('analit') ? 'measured'
      : normalize(cells[8]).includes('calcul') ? 'calculated'
      : 'estimated';
    const item = { amount, valueType, reference: cells[7] === '-' ? null : cells[7] };
    if (component === 'energia' && unit === 'kcal') values.set('energy_kcal', item);
    if (component.startsWith('proteina')) values.set('protein', item);
    if (component === 'lipidios' || component === 'lipidos' || component.includes('lipidios totales') || component.includes('lipidos totales')) values.set('fat_total', item);
    if (component.includes('carbo') && (component.includes('disponible') || component.includes('disponivel'))) values.set('carbohydrate_available', item);
    if (component.includes('carbo') && (component.includes('total') || component.includes('totales'))) values.set('carbohydrate_total', item);
  }
  return {
    energy: values.get('energy_kcal') ?? null,
    protein: values.get('protein') ?? null,
    carbohydrate: values.get('carbohydrate_available') ?? values.get('carbohydrate_total') ?? null,
    fat: values.get('fat_total') ?? null,
  };
}

async function readChapter(chapter) {
  const main = await getText(`${ROOT_URL}/main.php?sg2=${chapter.portalCode}&sg3=${chapter.chapterCode}`);
  const cookie = main.cookie;
  const first = await getText(`${ROOT_URL}/comp_foods_stat.php`, cookie);
  const pages = maxPage(first.text);
  const pageHtml = [first.text];
  for (let page = 2; page <= pages; page += 1) {
    pageHtml.push((await getText(`${ROOT_URL}/comp_foods_stat.php?pagina=${page}&atuald=1`, cookie)).text);
  }
  const byCode = new Map(pageHtml.flatMap((html) => parseListPage(html, chapter)).map((food) => [food.code, food]));
  const foods = [...byCode.values()];
  console.log(`${chapter.label}: ${foods.length} registros encontrados`);

  return mapConcurrent(foods, async (food, index) => {
    const detail = await getText(`${ROOT_URL}/int_comp_stat.php?cod_produto=${encodeURIComponent(food.code)}`, cookie);
    if ((index + 1) % 25 === 0 || index + 1 === foods.length) console.log(`${chapter.label}: ${index + 1}/${foods.length}`);
    return { ...food, nutrients: parseNutrients(detail.text) };
  });
}

const allFoods = [];
for (const chapter of chapters) {
  allFoods.push(...await readChapter(chapter));
}
const completeFoods = allFoods.filter((food) => food.nutrients.energy && food.nutrients.protein && food.nutrients.carbohydrate && food.nutrients.fat)
  .map((food) => ({
    source_food_code: food.code,
    names: food.names,
    group_code: groupCode(food.group),
    source_group: food.group,
    country_code: food.countryCode,
    country_label: food.countryLabel,
    food_type: /comida|fast food|prepar/i.test(food.group) ? 'prepared' : 'generic',
    energy_kcal: food.nutrients.energy.amount,
    protein_g: food.nutrients.protein.amount,
    carbohydrate_g: food.nutrients.carbohydrate.amount,
    fat_g: food.nutrients.fat.amount,
    nutrient_metadata: {
      energy: food.nutrients.energy,
      protein: food.nutrients.protein,
      carbohydrate: food.nutrients.carbohydrate,
      fat: food.nutrients.fat,
    },
  }));

await mkdir(dirname(OUTPUT_JSON), { recursive: true });
await writeFile(OUTPUT_JSON, `${JSON.stringify(completeFoods, null, 2)}\n`, 'utf8');

const json = JSON.stringify(completeFoods).replaceAll('$catalog$', '$ catalog $');
const sql = `-- Generated by scripts/import-latinfoods-test.mjs on ${new Date().toISOString()}.
-- INTERNAL TEST DATA ONLY. Review licensing before any public distribution.

do $seed$
declare
  portal_source_id uuid;
  portal_food_id uuid;
  item record;
begin
  insert into public.catalog_sources (
    name, publisher, source_url, version, published_year, license_name, license_url,
    attribution_text, usage_status, import_notes, metadata
  ) values (
    'Portal LATINFOODS test snapshot',
    'Red Latinoamericana de Composición de Alimentos (LATINFOODS)',
    'https://latinfoodsportal.net/',
    '1.0-test-${new Date().toISOString().slice(0, 10)}',
    2024,
    'CC BY-NC-ND 4.0 - test use only',
    'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    'Portal LATINFOODS de Composición de Alimentos, versión 1.0, 2024.',
    'restricted',
    'Private test import requested for Calorfy. Must not be promoted to a public production catalog without a separate release decision.',
    '{"test_only":true,"public_release_allowed":false,"basis":"per_100g"}'::jsonb
  )
  on conflict (name, version) do update set updated_at = now()
  returning id into portal_source_id;

  for item in
    select * from jsonb_to_recordset($catalog$${json}$catalog$::jsonb) as x(
      source_food_code text, names jsonb, group_code text, source_group text,
      country_code text, country_label text, food_type text,
      energy_kcal numeric, protein_g numeric, carbohydrate_g numeric, fat_g numeric,
      nutrient_metadata jsonb
    )
  loop
    insert into public.foods (
      canonical_name, food_type, group_code, origin_country_code, source_id,
      source_food_code, verification_status, quality_grade, default_portion_g,
      tags, metadata, verified_at
    ) values (
      item.names ->> 'es', item.food_type, item.group_code, item.country_code,
      portal_source_id, item.source_food_code, 'verified', 'B', 100,
      array['latinfoods', 'test-only'],
      jsonb_build_object('test_only', true, 'public_release_allowed', false, 'source_group', item.source_group, 'nutrients', item.nutrient_metadata),
      now()
    )
    on conflict (source_id, source_food_code) do update set
      canonical_name = excluded.canonical_name,
      group_code = excluded.group_code,
      origin_country_code = excluded.origin_country_code,
      metadata = excluded.metadata,
      updated_at = now()
    returning id into portal_food_id;

    insert into public.food_names (food_id, country_code, locale, name, name_type)
    values
      (portal_food_id, item.country_code, 'es', item.names ->> 'es', 'primary'),
      (portal_food_id, item.country_code, 'pt', item.names ->> 'pt', 'common'),
      (portal_food_id, item.country_code, 'en', item.names ->> 'en', 'common')
    on conflict do nothing;

    insert into public.food_nutrients (food_id, nutrient_code, amount_per_100g, value_type, source_id, confidence, notes)
    values
      (portal_food_id, 'energy_kcal', item.energy_kcal, 'calculated', portal_source_id, 4, 'LATINFOODS test snapshot'),
      (portal_food_id, 'protein', item.protein_g, 'measured', portal_source_id, 4, 'LATINFOODS test snapshot'),
      (portal_food_id, 'carbohydrate', item.carbohydrate_g, 'calculated', portal_source_id, 4, 'LATINFOODS test snapshot'),
      (portal_food_id, 'fat_total', item.fat_g, 'measured', portal_source_id, 4, 'LATINFOODS test snapshot')
    on conflict (food_id, nutrient_code) do update set
      amount_per_100g = excluded.amount_per_100g,
      source_id = excluded.source_id,
      notes = excluded.notes,
      updated_at = now();

    insert into public.food_country_presence (food_id, country_code, popularity, is_traditional, notes)
    values (portal_food_id, item.country_code, 3, false, 'LATINFOODS test snapshot')
    on conflict (food_id, country_code) do nothing;

    insert into public.food_portions (food_id, country_code, locale, label, grams, source_id, is_default)
    select portal_food_id, item.country_code, 'es', '100 g', 100, portal_source_id, true
    where not exists (
      select 1 from public.food_portions
      where food_id = portal_food_id and locale = 'es' and grams = 100
    );
  end loop;
end
$seed$;
`;

await writeFile(OUTPUT_SQL, sql, 'utf8');
console.log(`Importables: ${completeFoods.length}/${allFoods.length}`);
console.log(`JSON: ${OUTPUT_JSON}`);
console.log(`SQL: ${OUTPUT_SQL}`);
