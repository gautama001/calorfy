# Calorfy

Aplicación móvil para registrar comidas, estimar nutrientes a partir de fotografías y acompañar metas alimentarias. La base es Expo/React Native y apunta a iOS y Android, con lanzamiento inicial en App Store.

## Estado

Calorfy está en preparación para su primera versión pública. La rama de lanzamiento incorpora Supabase Auth, Postgres con Row Level Security y una Edge Function para mantener las credenciales de análisis fuera del cliente.

## Desarrollo local

Requisitos: Node.js 22 y npm.

```bash
npm ci
cp .env.example .env
npm run typecheck
npm run test:ci
npx expo start
```

Completá `.env` con la URL y la publishable key del proyecto Supabase. Nunca agregues una secret key o `service_role` a variables `EXPO_PUBLIC_*`.

## Supabase

Las migraciones y funciones se encuentran en `supabase/`.

```bash
npx supabase link --project-ref urqwsbzstbnktxxddhct
npx supabase db push
npx supabase functions deploy analyze-meal
```

Los secretos `CLARIFAI_PAT`, `EDAMAM_APP_ID` y `EDAMAM_APP_KEY` deben configurarse directamente como secrets de Supabase.

## Calidad

```bash
npm run typecheck
npm run test:ci
npx expo config --type public
```

El roadmap de lanzamiento está documentado en `docs/IOS_LAUNCH_AUDIT.md` y el flujo de contribución en `docs/GITHUB_WORKFLOW.md`.
