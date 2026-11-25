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
4. In the project terminal, sign the Supabase CLI in to your account. This uses a Supabase access token from your Supabase account settings; enter it only into the terminal prompt:

   ```sh
   npx --yes supabase@latest login
   ```

5. Run the deployment helper:

   ```sh
   bash scripts/deploy-snippe.sh
   ```

   It asks for your live HTTPS site URL and the **rotated** Snippe API key and webhook signing secret. Secret inputs are hidden; the helper writes them to a temporary permission-restricted file, sends them to project `vvtipknififdybbmrduo`, then deletes that file. It deploys the function with JWT verification disabled so Snippe can deliver webhooks. The function uses Supabase's server-side service-role key; no Snippe key is included in browser code.

After deployment, choose **Lipa online** in the menu. The customer is redirected to Snippe's hosted checkout; the order remains visible in Admin while payment is pending. A return to the menu shows the confirmed status after Snippe's signed webhook updates the order.

Local browser data that is not already in Supabase is uploaded when the app next connects. The SQL file cannot include data stored only in a browser's local storage.

## Security note

The current static app uses a publishable key and custom client-side staff accounts. Its compatibility policies allow public read/write access, so app data is not private and should not contain sensitive information. Never put an `sb_secret` key in this project. Private multi-user access requires moving staff login to Supabase Auth and tightening row-level security.
