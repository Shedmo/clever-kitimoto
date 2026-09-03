# Clever Kitimoto — Digital Menu & Admin

## Online orders (Supabase) — easy deploy

Oda kutoka menu zinahifadhiwa **mtandaoni** — admin anaona kwenye simu yoyote.

### Setup (3 hatua, ~3 dakika)

**1. Tengeneza database bure**
- Fungua [supabase.com](https://supabase.com) → **Start your project** (bure)
- **New project** → jina: `clever-kitimoto` → weka password → Create

**2. Tengeneza jedwali la oda**
- **SQL Editor** → **New query**
- Nakili yote kutoka `supabase/schema.sql` → **Run**
- **Database → Replication** → wezesha **orders** kwa Realtime (hiari, kwa sync haraka)

**3. Unganisha**
- **Project Settings → API**
- Nakili **Project URL** na **anon public** key
- Admin → **Zana** → weka URL + key → ✓ Wezesha → **Hifadhi & Unganisha** → **Jaribu Muunganisho**
- **Pakua cloud-config.js** → weka `assets/js/cloud-config.js` → push GitHub

Baada ya push, wateja wanaohamia menu wanahifadhi oda online automatically.

### Faili muhimu

| Faili | Kazi |
|-------|------|
| `supabase/schema.sql` | SQL ya ku-run mara moja |
| `assets/js/cloud-config.js` | URL + anon key (enabled: true) |
| `assets/js/orders-cloud.js` | Sync logic |

`enabled: false` = oda kwenye browser tu (localStorage).
