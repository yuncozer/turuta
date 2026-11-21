-- Pruebas de reglas de negocio y RLS. Ejecutar con supabase/tests/run.sh.
-- Cada bloque falla con una excepción si una regla no se cumple.
\set ON_ERROR_STOP on

-- Usuarios de prueba (el disparador crea los perfiles).
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'maria@test.ve',
   '{"full_name":"María Pérez","whatsapp":"+584140000000","consent_version":"2026-11"}'),
  ('22222222-2222-4222-8222-222222222222', 'google@test.ve', '{"name":"José Gómez"}'),
  ('33333333-3333-4333-8333-333333333333', 'admin@test.ve', '{"full_name":"Admin","consent_version":"2026-11"}');
update public.profiles set role = 'admin' where id = '33333333-3333-4333-8333-333333333333';

create or replace function pg_temp.as_user(p_uid text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(p_uid, ''), false);
$$;

-- 1. El registro con metadatos guarda consentimiento; con Google queda pendiente.
do $$ begin
  assert (select consent_at is not null from public.profiles where email = 'maria@test.ve'), 'consent maria';
  assert (select consent_at is null and full_name = 'José Gómez' from public.profiles where email = 'google@test.ve'), 'google pending';
end $$;

-- 2. RLS: anon ve solo comercios publicados y no ve secretos ni perfiles.
update public.merchants set is_published = false where slug = 'farmacia-feria-24h';
set role anon;
select pg_temp.as_user(null);
do $$ begin
  assert (select count(*) from public.merchants) = 5, 'anon ve 5 comercios publicados';
  assert (select count(*) from public.merchant_secrets) = 0, 'anon no ve secretos';
  assert (select count(*) from public.profiles) = 0, 'anon no ve perfiles';
  assert (select count(*) from public.coupons) = 4, 'anon ve cupones activos';
end $$;
do $$ begin
  perform public.claim_coupon('00000000-0000-4000-a000-000000000003');
  raise exception 'anon no debería poder reclamar';
exception when insufficient_privilege then null;
end $$;
reset role;
update public.merchants set is_published = true where slug = 'farmacia-feria-24h';

-- 3. Sin consentimiento no se obtiene cupón; tras aceptar, sí.
set role authenticated;
select pg_temp.as_user('22222222-2222-4222-8222-222222222222');
do $$ begin
  perform public.claim_coupon('00000000-0000-4000-a000-000000000003');
  raise exception 'debería exigir consentimiento';
exception when others then
  assert sqlerrm = 'consent_required', sqlerrm;
end $$;
select public.accept_terms('2026-11', 'José Gómez', '+584140000009');
do $$
declare a public.coupon_claims; b public.coupon_claims;
begin
  a := public.claim_coupon('00000000-0000-4000-a000-000000000003');
  b := public.claim_coupon('00000000-0000-4000-a000-000000000003');
  assert a.id = b.id, 'claim idempotente';
  assert a.code ~ '^TR-[A-Z0-9]{4}-[A-Z0-9]{2}$', 'formato de código ' || a.code;
end $$;
-- Un visitante no puede escribir directamente ni volverse admin.
do $$ begin
  insert into public.coupon_claims (coupon_id, user_id, code)
  values ('00000000-0000-4000-a000-000000000001', '22222222-2222-4222-8222-222222222222', 'TR-HACK-00');
  raise exception 'insert directo debería fallar';
exception when insufficient_privilege then null;
end $$;
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';
do $$ begin
  assert (select count(*) from public.coupon_claims) = 1, 'solo ve su claim';
  assert not public.is_admin(), 'no se volvió admin';
end $$;
-- Perfil completo → elegible para la rifa.
select public.complete_profile('San Cristóbal', 1995, array['comida', 'conciertos']);
do $$ begin
  assert (select profile_completed_at is not null from public.profiles where id = auth.uid()), 'perfil completo';
end $$;
reset role;

-- 4. Cupos: remaining baja exactamente uno por claim y "sold_out" al agotarse.
update public.coupons set total_quota = 1 where id = '00000000-0000-4000-a000-000000000003';
do $$ begin
  assert (select remaining from public.coupons where id = '00000000-0000-4000-a000-000000000003') = 0,
    'recalcula remaining con lo ya entregado';
end $$;
set role authenticated;
select pg_temp.as_user('11111111-1111-4111-8111-111111111111');
do $$ begin
  perform public.claim_coupon('00000000-0000-4000-a000-000000000003');
  raise exception 'debería estar agotado';
exception when others then
  assert sqlerrm = 'sold_out', sqlerrm;
end $$;
reset role;

-- 5. Canje: PIN, comercio correcto, una sola vez.
do $$
declare
  v_token_daniel text := (select validation_token from public.merchant_secrets
                           where merchant_id = '00000000-0000-4000-8000-000000000003');
  v_token_pizza  text := (select validation_token from public.merchant_secrets
                           where merchant_id = '00000000-0000-4000-8000-000000000001');
  v_code text := (select code from public.coupon_claims limit 1);
  r jsonb;
begin
  r := public.redeem_coupon(v_token_daniel, '0000', v_code);
  assert r ->> 'error' = 'bad_pin', r::text;
  r := public.redeem_coupon('token-falso', '1234', v_code);
  assert r ->> 'error' = 'invalid_link', r::text;
  r := public.redeem_coupon(v_token_pizza, '1234', v_code);
  assert r ->> 'error' = 'other_merchant', r::text;
  r := public.redeem_coupon(v_token_daniel, '1234', lower(v_code));
  assert (r ->> 'ok')::boolean and r ->> 'customer' = 'José G.', r::text;
  r := public.redeem_coupon(v_token_daniel, '1234', v_code);
  assert r ->> 'error' = 'already_redeemed', r::text;
  r := public.merchant_portal(v_token_daniel, '1234');
  assert (r ->> 'today_redemptions')::int = 1, r::text;
end $$;

-- 6. Bloqueo tras 5 PIN erróneos (los intentos fallidos sí quedan registrados).
do $$
declare
  v_token text := (select validation_token from public.merchant_secrets
                    where merchant_id = '00000000-0000-4000-8000-000000000002');
  r jsonb;
begin
  for i in 1..5 loop r := public.merchant_portal(v_token, '9999'); end loop;
  assert r ->> 'error' = 'locked', r::text;
  r := public.merchant_portal(v_token, '1234');
  assert r ->> 'error' = 'locked', 'sigue bloqueado con PIN correcto: ' || r::text;
end $$;

-- 7. Métricas públicas y panel admin.
set role anon;
select public.track_merchant('00000000-0000-4000-8000-000000000003', 'views');
select public.track_merchant('00000000-0000-4000-8000-000000000003', 'map_clicks');
do $$ begin
  perform public.track_merchant('00000000-0000-4000-8000-000000000003', 'redemptions');
  raise exception 'métrica no permitida';
exception when others then assert sqlerrm = 'invalid_metric', sqlerrm;
end $$;
do $$ begin
  perform public.admin_summary();
  raise exception 'anon no debe ver el resumen';
exception when insufficient_privilege then null;
end $$;
reset role;
set role authenticated;
select pg_temp.as_user('33333333-3333-4333-8333-333333333333');
do $$
declare s jsonb := public.admin_summary();
begin
  assert (s ->> 'users')::int = 2, s::text;
  assert (s ->> 'coupons_redeemed')::int = 1, s::text;
  assert (select views from public.merchant_report where merchant_id = '00000000-0000-4000-8000-000000000003') = 1;
  assert (select redemptions from public.merchant_report where merchant_id = '00000000-0000-4000-8000-000000000003') = 1;
  assert (select count(*) from public.profiles) = 3, 'admin ve todos los perfiles';
end $$;
reset role;

-- 8. Comercio nuevo recibe enlace automáticamente.
insert into public.merchants (slug, name, category) values ('nuevo-local', 'Nuevo local', 'comida');
do $$ begin
  assert (select count(*) from public.merchant_secrets s join public.merchants m on m.id = s.merchant_id
           where m.slug = 'nuevo-local') = 1, 'secreto creado';
end $$;

\echo 'OK: reglas de negocio y RLS'
