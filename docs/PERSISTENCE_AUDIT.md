# Calorfy persistence audit

Updated: 2026-07-22

## Source of truth

| Domain | Remote source | Local role | Status |
| --- | --- | --- | --- |
| Authentication | Supabase Auth | Native session storage | Persistent |
| Meals and meal items | `meals`, `meal_items` | Per-user, per-day read cache | Persistent and transactional |
| Weight and progress | `weight_entries`, `user_goals` | Per-user read cache | Persistent and atomic |
| Goals and nutrition targets | `user_goals` | Per-user read cache | Persistent |
| Personal recipes | `meal_templates`, `meal_template_items` | Per-user read cache | Persistent and transactional |
| Weekly plan | `weekly_plans`, `weekly_plan_items` | Per-user, per-week read cache | Persistent |
| Language, theme, reminder time and target mode | `profiles` | Per-user read cache plus device fallback | Persistent after migration `202607220001` |
| Water and steps prototype | `daily_activity` | Legacy global device keys | Not exposed in navigation; must be rebuilt before enabling |

## Guarantees already present

- All user-owned tables use row-level security and compare their owner with `auth.uid()`.
- Meal, recipe, weight and plan creation use authenticated database functions for multi-row writes.
- Meal creation carries a client event ID to prevent duplicate inserts after a retry.
- Remote writes are completed before the UI reports success; local storage is only a cache for launch-critical data.
- Account deletion cascades through user-owned database rows and removes stored meal images.

## Follow-up priorities

1. Add an explicit offline/pending-write strategy instead of silently keeping stale cached reads.
2. Add integration tests with two isolated users to prove RLS boundaries.
3. Decide whether activity tracking belongs in launch scope; if it does, replace the hidden legacy screen and connect it to `daily_activity`.
4. Add observable sync timestamps and retry actions to meals, goals, recipes and plans.
