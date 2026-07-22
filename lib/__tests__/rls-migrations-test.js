const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const schema = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => readFileSync(join(migrationsDirectory, name), 'utf8'))
  .join('\n');

describe('database row-level security contract', () => {
  it('enables RLS on every public table created by Calorfy migrations', () => {
    const tables = [...schema.matchAll(/create table public\.([a-z_]+)/g)].map((match) => match[1]);
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach((table) => {
      expect(schema).toContain(`alter table public.${table} enable row level security`);
    });
  });

  it.each([
    'profiles',
    'user_goals',
    'meals',
    'weight_entries',
    'daily_activity',
    'food_submissions',
    'meal_items',
    'meal_templates',
    'meal_template_items',
    'goal_cycles',
    'weekly_plans',
    'weekly_plan_items',
  ])('ties policies for %s to the authenticated user', (table) => {
    const policy = new RegExp(`create policy[^;]+on public\\.${table}[^;]+auth\\.uid\\(\\)`, 'i');
    expect(schema).toMatch(policy);
  });

  it('keeps stored meal images inside the authenticated user folder', () => {
    expect(schema).toMatch(/bucket_id = 'meal-images'[^;]+auth\.uid\(\)/i);
  });
});
