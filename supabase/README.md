# Supabase local setup

1. Create a Supabase project in the desired production region.
2. Copy `.env.example` to `.env` and set the project URL and **publishable** key.
3. Apply migrations with `supabase db push`, or paste the migration into the SQL editor for the first bootstrap.
4. Keep secret/service-role keys out of Expo, Git and EAS client variables.
5. Configure Auth redirect URLs for `calorfy://**` before enabling magic links or OAuth.
6. Set Edge Function secrets with `supabase secrets set CLARIFAI_PAT=... EDAMAM_APP_ID=... EDAMAM_APP_KEY=...`.
7. Deploy the protected function with `supabase functions deploy analyze-meal`.

The `meal-images` bucket is private. Object paths must start with the authenticated user ID because the storage policies enforce ownership.
