# Supabase — Clever Kitimoto (connected)

Project URL: `https://vvtipknififdybbmrduo.supabase.co`

Config is in `assets/js/cloud-config.js` (enabled).

## One step left — create the orders + sales tables

1. Open [SQL Editor for this project](https://supabase.com/dashboard/project/vvtipknififdybbmrduo/sql/new)
2. If **first time**: copy all of `schema.sql` → **Run**
3. If you already ran `schema.sql` before POS sync: copy `sales-migration.sql` → **Run**
4. (Optional) **Database → Publications** → enable **orders** and **sales** for Realtime

Then in Admin → **Zana** → **Jaribu Muunganisho** — should show success and **☁️ Live**.

After that, push to GitHub so the customer menu and POS also save online.
