#!/usr/bin/env bash
# Ráfaga de cupón: N usuarios piden a la vez un cupón con CUPO cupos.
# Debe entregar exactamente CUPO cupones, nunca más.
set -euo pipefail
DB="${1:?uso: concurrency.sh <db>}"
N="${N:-300}"
CUPO="${CUPO:-50}"
COUPON='00000000-0000-4000-a000-000000000001'
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$DB")

"${PSQL[@]}" <<SQL
update public.coupons set total_quota = $CUPO where id = '$COUPON';
delete from public.coupon_claims where coupon_id = '$COUPON';
update public.coupons set total_quota = $CUPO + 1 where id = '$COUPON';
update public.coupons set total_quota = $CUPO where id = '$COUPON';
insert into auth.users (id, email, raw_user_meta_data)
select gen_random_uuid(), 'carga' || g || '@test.ve', '{"full_name":"Carga","consent_version":"2026-11"}'
from generate_series(1, $N) g;
SQL

"${PSQL[@]}" -At -c "select id from public.profiles where email like 'carga%'" > /tmp/fiss_uids.txt

claim() {
  psql -X -q -d "$DB" -c "set role authenticated; select set_config('request.jwt.claim.sub', '$1', false); select public.claim_coupon('$COUPON');" >/dev/null 2>&1 && echo ok || echo fail
}
export -f claim
export DB COUPON
results=$(xargs -P 50 -I{} bash -c 'claim {}' < /tmp/fiss_uids.txt)
ok=$(grep -c '^ok$' <<<"$results" || true)
claims=$("${PSQL[@]}" -At -c "select count(*) from public.coupon_claims where coupon_id = '$COUPON'")
remaining=$("${PSQL[@]}" -At -c "select remaining from public.coupons where id = '$COUPON'")

echo "solicitudes=$N exitosas=$ok claims=$claims remaining=$remaining"
[[ "$ok" == "$CUPO" && "$claims" == "$CUPO" && "$remaining" == "0" ]] || { echo "FALLO: cupos inconsistentes"; exit 1; }
echo "OK: ráfaga de cupón"
