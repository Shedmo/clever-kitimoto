# Supabase — Clever Kitimoto (connected)

Project URL: `https://vvtipknififdybbmrduo.supabase.co`

Config is in `assets/js/cloud-config.js` (enabled).

## Create tables and seed the initial app data

1. Open [SQL Editor for this project](https://supabase.com/dashboard/project/vvtipknififdybbmrduo/sql/new)
2. Copy all of `schema.sql` into a new query and click **Run**.
3. The script creates or updates `orders`, `sales`, and `app_storage`, enables Realtime, and seeds the default main branch, starting POS products, and menu prices. It is safe to run again and will not replace existing cloud records.
4. Open Admin → **Zana** → **Jaribu Muunganisho** to verify the app connection.

## Snippe online payment

Customer checkout now offers Snippe mobile-money checkout. Each menu order adds a clearly shown **TSh 200 service fee** once per order. The order is saved first, Snippe collects the exact total on its hosted checkout page, and the signed webhook changes the order payment state to **Imelipwa** only after confirmation.

1. **Rotate the Snippe API key that was pasted into chat.** Treat that key as exposed. Create a replacement with the `collection:create` scope; do not paste it into this repository or the browser.
2. In the Snippe dashboard, copy the account's webhook signing secret. Keep both values private.
3. Run `snippe-payment-migration.sql` in Supabase SQL Editor so the new payment columns exist. A fresh Supabase project can instead run the full `schema.sql`.
4. Install and sign into the Supabase CLI, then deploy the function with JWT verification disabled (Snippe's webhook cannot send a Supabase JWT):

   ```sh
   supabase functions deploy snippe-checkout --no-verify-jwt --project-ref vvtipknififdybbmrduo
   ```

5. Set the secrets from your terminal. Replace the placeholders locally; do not send their values in chat or commit them:

   ```sh
   supabase secrets set SNIPPE_API_KEY='PASTE_ROTATED_KEY_HERE' SNIPPE_WEBHOOK_SECRET='PASTE_WEBHOOK_SECRET_HERE' SITE_URL='https://your-live-site.example' --project-ref vvtipknififdybbmrduo
   ```

   `SITE_URL` must be the public HTTPS URL where customers use the menu. The function uses Supabase's server-side service role key supplied to the Edge Function runtime; the Snippe key is never sent to the browser.

After deployment, choose **Lipa online** in the menu. The customer is redirected to Snippe's hosted checkout; the order remains visible in Admin while payment is pending. A return to the menu shows the confirmed status after Snippe's signed webhook updates the order.

Local browser data that is not already in Supabase is uploaded when the app next connects. The SQL file cannot include data stored only in a browser's local storage.

## Security note

The current static app uses a publishable key and custom client-side staff accounts. Its compatibility policies allow public read/write access, so app data is not private and should not contain sensitive information. Never put an `sb_secret` key in this project. Private multi-user access requires moving staff login to Supabase Auth and tightening row-level security.
