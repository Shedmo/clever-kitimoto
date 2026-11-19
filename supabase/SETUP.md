# Supabase — Clever Kitimoto (connected)

Project URL: `https://vvtipknififdybbmrduo.supabase.co`

Config is in `assets/js/cloud-config.js` (enabled).

## Create tables and seed the initial app data

1. Open [SQL Editor for this project](https://supabase.com/dashboard/project/vvtipknififdybbmrduo/sql/new)
2. Copy all of `schema.sql` into a new query and click **Run**.
3. The script creates or updates `orders`, `sales`, and `app_storage`, enables Realtime, and seeds the default main branch, starting POS products, and menu prices. It is safe to run again and will not replace existing cloud records.
4. Open Admin → **Zana** → **Jaribu Muunganisho** to verify the app connection.

Local browser data that is not already in Supabase is uploaded when the app next connects. The SQL file cannot include data stored only in a browser's local storage.

## Security note

The current static app uses a publishable key and custom client-side staff accounts. Its compatibility policies allow public read/write access, so app data is not private and should not contain sensitive information. Never put an `sb_secret` key in this project. Private multi-user access requires moving staff login to Supabase Auth and tightening row-level security.
