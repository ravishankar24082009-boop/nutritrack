# USDA FoodData Central setup

The browser calls the `usda-food-search` Supabase Edge Function. The function reads the USDA credential from Supabase; the USDA key must never be placed in `index.html` or committed to GitHub.

1. In Supabase Dashboard, open **Edge Functions → Secrets** and make sure your USDA key is saved under the exact name `USDA_API_KEY`.
2. The Supabase GitHub integration should point to this repository, use working directory `.`, target branch `main`, and have **Deploy to production** enabled. This is the setup shown in the project screenshot. The function is declared in `supabase/config.toml`, so a push to `main` deploys it to Supabase; Vercel also deploys the updated web page.
3. In the deployed NutriTrack page, type at least two characters in the food field and select a USDA result. Its nutrition values are saved with the food when added to the log.

The function can be called without signing in, so USDA lookup works before account sync. It only returns FoodData Central Foundation, SR Legacy, and FNDDS results. The USDA key stays server-side in Supabase.
