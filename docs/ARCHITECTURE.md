# Calorfy architecture

## Product boundary

Calorfy is a cross-platform nutrition product built around a LATAM food knowledge graph. The first public client is iOS, while Android and web remain supported by the same Expo application.

## System of record

```text
Expo app (iOS / Android / web)
  ├─ Presentation: Expo Router screens and reusable components
  ├─ Product services: diary, goals, food search and authentication
  ├─ Local cache: AsyncStorage (fast reads and future offline queue)
  └─ Supabase client
       ├─ Auth
       ├─ Postgres + RLS (system of record)
       ├─ RPCs for transactional writes
       └─ Storage for private meal images
```

Supabase is authoritative for user data and curated catalog data. AsyncStorage must never be the only copy of authenticated user data; it is a replaceable cache. Reads may render cached data first and refresh from Supabase. Multi-table writes use idempotent RPCs so a retry cannot create duplicate meals.

## Domain modules

### Identity

- Supabase Auth owns sessions and identities.
- `profiles` contains app-specific identity preferences.
- Every user-owned table uses row-level security.
- Account deletion, privacy controls and guest onboarding are product requirements before App Store submission.

### Food knowledge graph

- `foods` is the canonical identity of a food or preparation.
- `food_names` contains localized, regional and synonym names.
- `food_nutrients` stores values with source and confidence.
- `food_portions` stores household measures and gram equivalents.
- `food_country_presence` models relevance without hiding foods from global search.
- `catalog_sources` is the chain of provenance and usage rights.

Imported source data and Calorfy's proprietary enrichment must remain distinguishable. Regional aliases, portion corrections, popularity signals and user-specific choices are first-class data, not text embedded in food names.

### Diary

- `meals` stores the meal event and its nutritional totals.
- `meal_items` stores the immutable food/name/nutrition snapshot used for that event.
- `create_meal_with_items` writes both atomically and accepts a client-generated idempotency key.
- The client diary repository maps database records to one stable application model and maintains a per-user, per-day cache.

Snapshots are intentional: later catalog corrections must not silently rewrite a user's historical diary.

### Personal recipes

- `meal_templates` and `meal_template_items` are reusable records independent from diary history.
- A recipe stores its complete nutritional snapshot plus a user-defined yield such as 12 empanadas or 4 portions.
- Logging a consumed quantity scales every component before placing it in the preliminary meal list.
- Favorites remain lightweight shortcuts to historical meals; recipes are the durable, named user asset.

### Goals and progress

- `user_goals`, `weight_entries` and `daily_activity` are server-owned user data.
- The goals repository serves cached values first, synchronizes with Supabase and performs a one-time migration of legacy device data.
- A weigh-in updates `weight_entries` and the profile's current weight in one transaction.
- Goals, Settings and the daily dashboard consume the same target values.
- Adaptive energy recommendations will be a separate versioned service; raw observations must remain separate from computed recommendations.

## Dependency rules

1. Screens and components do not query Supabase or mutate AsyncStorage directly.
2. Domain repositories own remote queries, cache keys and data mapping.
3. Components receive typed domain models.
4. Transactional business operations live in database RPCs or trusted server functions.
5. Analytics records product events, never health values or meal contents.
6. AI output is a proposal with confidence and user confirmation, never the nutritional source of truth.

## Delivery sequence

1. Reliable diary and authentication.
2. Fast regional search, realistic portions, preliminary list and repeat/favorites.
3. Goals and weight synchronized across devices.
4. Product analytics, crash reporting and catalog coverage metrics.
5. Natural-language/voice logging grounded in the food graph.
6. HealthKit and adaptive energy estimation.
7. Nutritionist workspace and verified correction workflow.

## Architecture decisions still pending

- Offline mutation queue and conflict policy.
- Analytics/crash provider after privacy review.
- Subscription provider and entitlement model.
- Production rights review for every catalog source currently marked test-only or pending.
- Whether professional tooling shares this repository or uses a separate web client.
