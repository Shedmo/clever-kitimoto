#!/usr/bin/env bash
# Clever Kitimoto — test all Supabase cloud processes
# Usage: ./scripts/test-cloud.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$ROOT/assets/js/cloud-config.js"

URL=$(grep -oP "supabaseUrl:\s*'\K[^']+" "$CONFIG" 2>/dev/null || true)
KEY=$(grep -oP "supabaseAnonKey:\s*'\K[^']+" "$CONFIG" 2>/dev/null || true)

if [[ -z "$URL" || -z "$KEY" ]]; then
  echo "FAIL: cloud-config.js missing URL or key"
  exit 1
fi

API="$URL/rest/v1"
HDR=(-H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json")
TS=$(date +%s)
PASS=0
FAIL=0

check() {
  local name="$1" code="$2" expect="$3"
  if [[ "$code" == "$expect" ]]; then
    echo "  ✓ $name (HTTP $code)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name (HTTP $code, expected $expect)"
    FAIL=$((FAIL + 1))
  fi
}

echo "Clever Kitimoto — Cloud E2E Test"
echo "Project: $URL"
echo ""

echo "1. Customer order (orders table)"
R=$(curl -s -o /tmp/t1.json -w "%{http_code}" -X POST "$API/orders" "${HDR[@]}" \
  -H "Prefer: return=minimal" \
  -d "{\"id\":\"test-order-$TS\",\"channel\":\"whatsapp\",\"phone\":\"0711000000\",\"subtotal\":35000,\"items\":[{\"name\":\"1 KG Mix\",\"qty\":1}],\"status\":\"pending\"}")
check "Insert customer order" "$R" "201"

echo "2. POS sale (sales table)"
R=$(curl -s -o /tmp/t2.json -w "%{http_code}" -X POST "$API/sales" "${HDR[@]}" \
  -H "Prefer: return=minimal" \
  -d "{\"id\":\"test-sale-$TS\",\"item_name\":\"Choma\",\"qty\":0.5,\"unit\":\"KG\",\"total\":9000,\"branch_id\":\"br-main\",\"branch_name\":\"DARAJANI\",\"seller\":\"seller\",\"payment\":\"cash\"}")
check "Insert POS sale" "$R" "201"

echo "3. POS fallback (orders channel=pos)"
R=$(curl -s -o /tmp/t3.json -w "%{http_code}" -X POST "$API/orders" "${HDR[@]}" \
  -H "Prefer: return=minimal" \
  -d "{\"id\":\"test-pos-$TS\",\"channel\":\"pos\",\"address\":\"DARAJANI\",\"notes\":\"Muuzaji: seller · BranchId: br-main\",\"payment\":\"cash\",\"subtotal\":9000,\"items\":[{\"name\":\"Choma\",\"qty\":0.5}],\"status\":\"delivered\",\"status_by\":\"seller\"}")
check "Insert POS via orders" "$R" "201"

echo "4. App storage (menu/stock/branches)"
R=$(curl -s -o /tmp/t4.json -w "%{http_code}" -X POST "$API/app_storage" "${HDR[@]}" \
  -H "Prefer: return=minimal" \
  -d "{\"storage_key\":\"cleverKitimotoTestV1\",\"data\":{\"ok\":true},\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
if [[ "$R" == "201" ]]; then
  check "Insert app_storage" "$R" "201"
  curl -s -X DELETE "$API/app_storage?storage_key=eq.cleverKitimotoTestV1" "${HDR[@]}" >/dev/null
elif [[ "$R" == "404" ]]; then
  echo "  ⚠ app_storage missing — run supabase/cloud-storage-migration.sql in SQL Editor"
  FAIL=$((FAIL + 1))
else
  check "Insert app_storage" "$R" "201"
fi

echo "5. Read orders"
R=$(curl -s -o /tmp/t5.json -w "%{http_code}" "$API/orders?select=id&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
check "Read orders" "$R" "200"

echo "6. Read sales"
R=$(curl -s -o /tmp/t6.json -w "%{http_code}" "$API/sales?select=id&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
check "Read sales" "$R" "200"

echo ""
echo "Cleanup test rows..."
curl -s -X DELETE "$API/orders?id=eq.test-order-$TS" "${HDR[@]}" >/dev/null || true
curl -s -X DELETE "$API/orders?id=eq.test-pos-$TS" "${HDR[@]}" >/dev/null || true
curl -s -X DELETE "$API/sales?id=eq.test-sale-$TS" "${HDR[@]}" >/dev/null || true

echo ""
echo "JS syntax check..."
node --check "$ROOT/assets/js/cloud-sync.js"
node --check "$ROOT/assets/js/orders-cloud.js"
node --check "$ROOT/assets/js/admin.js"
node --check "$ROOT/assets/js/app.js"
echo "  ✓ All JS files OK"

echo ""
echo "================================"
echo "PASSED: $PASS | FAILED/WARN: $FAIL"
if [[ $FAIL -gt 0 ]]; then
  echo "Fix: run missing SQL migrations in Supabase SQL Editor"
  exit 1
fi
echo "All cloud processes OK ✓"
