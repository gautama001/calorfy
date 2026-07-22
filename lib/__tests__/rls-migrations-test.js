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
    'professional_profiles',
    'professional_invites',
    'professional_client_relationships',
    'professional_client_permissions',
    'professional_access_audit',
  ])('ties policies for %s to the authenticated user', (table) => {
    const policy = new RegExp(`create policy[^;]+on public\\.${table}[^;]+auth\\.uid\\(\\)`, 'i');
    expect(schema).toMatch(policy);
  });

  it('keeps stored meal images inside the authenticated user folder', () => {
    expect(schema).toMatch(/bucket_id = 'meal-images'[^;]+auth\.uid\(\)/i);
  });

  it('stores professional invitations as hashes rather than reusable raw tokens', () => {
    const inviteTable = schema.match(/create table public\.professional_invites\s*\(([\s\S]*?)\);/i)?.[1] ?? '';
    expect(inviteTable).toMatch(/token_hash text not null unique/i);
    expect(inviteTable).not.toMatch(/raw_token text/i);
    expect(schema).toMatch(/digest\(raw_token, 'sha256'\)/i);
  });

  it('keeps health tables owner-only until scoped professional access is implemented', () => {
    ['meals', 'meal_items', 'user_goals', 'weight_entries'].forEach((table) => {
      const tablePolicies = schema.match(new RegExp(`create policy[^;]+on public\\.${table}[^;]+`, 'gi')) ?? [];
      expect(tablePolicies.join('\n')).not.toMatch(/professional_client/i);
    });
  });

  it('scopes the client professional read model to the authenticated client', () => {
    expect(schema).toMatch(/get_client_professional_connections\(\)[\s\S]+relationship\.client_id = auth\.uid\(\)/i);
    expect(schema).toMatch(/revoke all on function public\.get_client_professional_connections\(\) from public/i);
    expect(schema).toMatch(/grant execute on function public\.get_client_professional_connections\(\) to authenticated/i);
  });
});
