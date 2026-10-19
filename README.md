# Clever Kitimoto — Digital Menu & Admin

## Online orders (Supabase) — easy deploy

Oda, mauzo ya POS, **menu, stock, matawi, wafanyakazi, na visits** zote zinahifadhiwa **mtandaoni** kupitia Supabase.

### Setup (3 hatua, ~3 dakika)

**1. Tengeneza database bure**
- Fungua [supabase.com](https://supabase.com) → **Start your project** (bure)
- **New project** → jina: `clever-kitimoto` → weka password → Create

**2. Tengeneza jedwali (SQL Editor → Run)**
- **Mara ya kwanza:** nakili yote kutoka `supabase/schema.sql`
- **Ulishawahi run schema.sql:** run pia:
  - `supabase/sales-migration.sql` (mauzo POS)
  - `supabase/cloud-storage-migration.sql` (menu, stock, branches, staff, visits)
- **Database → Replication** → wezesha **orders**, **sales**, **app_storage** (hiari, Realtime)

**3. Unganisha**
- Admin → **Zana** → weka Supabase URL + Anon Key → ✓ Wezesha → **Hifadhi & Unganisha** → **Jaribu Muunganisho**
- **Pakua cloud-config.js** → weka `assets/js/cloud-config.js` → push GitHub

Baada ya push, kila mabadiliko (bei, stock, mauzo, oda) yanasave online automatically.

### Usimamizi wa faida kwa kila tawi

Kwenye **Admin → Ripoti → Faida & Hasara**, chagua tawi husika kisha rekodi matumizi kama ununuzi wa nyama, mishahara, kodi, mkaa/gesi, usafiri na umeme. Mfumo huhesabu:

`Mauzo − gharama ya bidhaa − uharibifu − matumizi = faida halisi`

Faida halisi chanya hugawanywa moja kwa moja: **40% mwenye biashara** na **60% biashara/akiba**. Chagua **Matawi Yote** kuona muhtasari wa pamoja; chagua tawi moja ili kuongeza au kufuta matumizi yake.

### Menu Smart

Kwenye **Admin → Menu & Bei → Ongeza Menu Smart**, weka jina, bei, gharama, kipimo na stock ya kuanza. Ukiweka tiki ya POS, menu hiyo itaonekana kwa wateja na pia itaongezwa moja kwa moja kwenye POS ya tawi ulilochagua; mauzo yataipunguza stock na kuhesabu faida.

### Faili muhimu

| Faili | Kazi |
|-------|------|
| `supabase/schema.sql` | SQL kamili (orders + sales + app_storage) |
| `supabase/sales-migration.sql` | Ongeza jedwali sales |
| `supabase/cloud-storage-migration.sql` | Ongeza app_storage (data yote) |
| `assets/js/cloud-config.js` | URL + anon key (enabled: true) |
| `assets/js/orders-cloud.js` | Oda + mauzo POS |
| `assets/js/cloud-sync.js` | Menu, stock, branches, staff, visits |

`enabled: false` = oda kwenye browser tu (localStorage).
