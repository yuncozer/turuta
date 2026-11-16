-- FISS 2027 · Funciones de negocio
-- Todas las operaciones sensibles (perfil, cupones, canje, métricas) pasan por aquí,
-- dentro de una transacción, para garantizar cupos exactos y canjes únicos.

-- Día de la feria en hora de Venezuela.
create or replace function public.fair_today()
returns date language sql stable as $$
  select (now() at time zone 'America/Caracas')::date;
$$;

create or replace function public.bump_stat(p_merchant_id uuid, p_metric text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_metric not in ('views', 'map_clicks', 'whatsapp_clicks', 'claims', 'redemptions') then
    raise exception 'invalid_metric';
  end if;
  execute format(
    'insert into public.merchant_stats_daily as s (merchant_id, day, %1$I) values ($1, public.fair_today(), 1)
     on conflict (merchant_id, day) do update set %1$I = s.%1$I + 1',
    p_metric
  ) using p_merchant_id;
end $$;
revoke all on function public.bump_stat(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Perfil
-- ---------------------------------------------------------------------------

-- Acepta la política de privacidad y guarda los datos mínimos (registro con Google o correo).
create or replace function public.accept_terms(p_version text, p_full_name text, p_whatsapp text)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  if coalesce(trim(p_full_name), '') = '' or coalesce(trim(p_whatsapp), '') = '' then
    raise exception 'missing_fields';
  end if;
  update public.profiles
     set full_name = trim(p_full_name),
         whatsapp = trim(p_whatsapp),
         consent_version = p_version,
         consent_at = now(),
         opted_out_at = null
   where id = auth.uid()
  returning * into v_profile;
  return v_profile;
end $$;

-- Completa el perfil (municipio, edad, intereses) → participa en la rifa de cierre.
create or replace function public.complete_profile(p_municipality text, p_birth_year int, p_interests text[])
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  update public.profiles
     set municipality = nullif(trim(p_municipality), ''),
         birth_year = p_birth_year,
         interests = coalesce(p_interests, '{}'),
         profile_completed_at = case
           when nullif(trim(p_municipality), '') is not null and p_birth_year is not null
                and cardinality(coalesce(p_interests, '{}')) > 0
           then coalesce(profile_completed_at, now())
         end
   where id = auth.uid()
  returning * into v_profile;
  return v_profile;
end $$;

-- Darse de baja del uso comercial de sus datos (o volver a darse de alta).
create or replace function public.set_marketing_opt_out(p_opt_out boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  update public.profiles
     set opted_out_at = case when p_opt_out then now() end
   where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------------
-- Cupones
-- ---------------------------------------------------------------------------
create or replace function public.generate_coupon_code()
returns text language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(6);
  raw text := '';
begin
  for i in 0..5 loop
    raw := raw || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return 'FISS-' || substr(raw, 1, 4) || '-' || substr(raw, 5, 2);
end $$;

-- Obtiene un cupón. Idempotente: si el usuario ya lo tiene, devuelve el mismo.
-- Nunca entrega más cupos que los disponibles (UPDATE condicional dentro de la transacción).
create or replace function public.claim_coupon(p_coupon_id uuid)
returns public.coupon_claims language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid     uuid := auth.uid();
  v_coupon  public.coupons;
  v_claim   public.coupon_claims;
  v_attempt int := 0;
begin
  if v_uid is null then raise exception 'auth_required'; end if;

  if not exists (select 1 from public.profiles where id = v_uid and consent_at is not null) then
    raise exception 'consent_required';
  end if;

  -- Serializa los intentos del mismo usuario sobre el mismo cupón.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || p_coupon_id::text, 0));

  select * into v_claim from public.coupon_claims where coupon_id = p_coupon_id and user_id = v_uid;
  if found then return v_claim; end if;

  select c.* into v_coupon
    from public.coupons c
    join public.merchants m on m.id = c.merchant_id
   where c.id = p_coupon_id and c.is_active and m.is_published and c.valid_until > now();
  if not found then raise exception 'coupon_unavailable'; end if;

  if v_coupon.kind = 'cupo' then
    update public.coupons set remaining = remaining - 1
     where id = p_coupon_id and remaining > 0;
    if not found then raise exception 'sold_out'; end if;
  end if;

  loop
    begin
      insert into public.coupon_claims (coupon_id, user_id, code)
      values (p_coupon_id, v_uid, public.generate_coupon_code())
      returning * into v_claim;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise; end if;
    end;
  end loop;

  perform public.bump_stat(v_coupon.merchant_id, 'claims');
  return v_claim;
end $$;

-- ---------------------------------------------------------------------------
-- Modo comercio (sin cuenta): enlace con token + PIN
-- ---------------------------------------------------------------------------

-- Verifica token y PIN. Cuenta intentos fallidos y bloquea 15 min tras 5 fallos.
-- Devuelve el id del comercio, o null con el motivo en p_error.
create or replace function public.verify_merchant(p_token text, p_pin text, out merchant_id uuid, out error text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_secret public.merchant_secrets;
begin
  select * into v_secret from public.merchant_secrets where validation_token = p_token for update;
  if not found then
    error := 'invalid_link';
    return;
  end if;
  if v_secret.locked_until is not null and v_secret.locked_until > now() then
    error := 'locked';
    return;
  end if;
  if v_secret.pin_hash is null or extensions.crypt(coalesce(p_pin, ''), v_secret.pin_hash) <> v_secret.pin_hash then
    update public.merchant_secrets
       set failed_attempts = case when failed_attempts + 1 >= 5 then 0 else failed_attempts + 1 end,
           locked_until    = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end
     where merchant_secrets.merchant_id = v_secret.merchant_id;
    error := case when v_secret.failed_attempts + 1 >= 5 then 'locked' else 'bad_pin' end;
    return;
  end if;
  if v_secret.failed_attempts > 0 then
    update public.merchant_secrets set failed_attempts = 0, locked_until = null
     where merchant_secrets.merchant_id = v_secret.merchant_id;
  end if;
  merchant_id := v_secret.merchant_id;
end $$;
revoke all on function public.verify_merchant(text, text) from public, anon, authenticated;

-- Resumen para la pantalla del comercio: nombre, canjes de hoy y cupos restantes.
create or replace function public.merchant_portal(p_token text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v record;
begin
  select * into v from public.verify_merchant(p_token, p_pin);
  if v.merchant_id is null then
    return jsonb_build_object('ok', false, 'error', v.error);
  end if;
  return jsonb_build_object(
    'ok', true,
    'merchant', (select jsonb_build_object('name', name, 'logo_url', logo_url) from public.merchants where id = v.merchant_id),
    'today_redemptions', coalesce((select redemptions from public.merchant_stats_daily
                                    where merchant_stats_daily.merchant_id = v.merchant_id and day = public.fair_today()), 0),
    'coupons', coalesce((select jsonb_agg(jsonb_build_object('title', title, 'kind', kind, 'remaining', remaining,
                                                             'valid_until', valid_until, 'is_active', is_active)
                                          order by created_at)
                           from public.coupons where coupons.merchant_id = v.merchant_id), '[]'::jsonb)
  );
end $$;

-- Canjea un cupón. Solo el comercio emisor puede hacerlo y solo una vez.
create or replace function public.redeem_coupon(p_token text, p_pin text, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v       record;
  v_code  text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  v_claim record;
  v_count int;
begin
  select * into v from public.verify_merchant(p_token, p_pin);
  if v.merchant_id is null then
    return jsonb_build_object('ok', false, 'error', v.error);
  end if;

  select cc.id, cc.redeemed_at, c.merchant_id, c.title, c.valid_until, p.full_name
    into v_claim
    from public.coupon_claims cc
    join public.coupons c on c.id = cc.coupon_id
    join public.profiles p on p.id = cc.user_id
   where cc.code = v_code
   for update of cc;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_claim.merchant_id <> v.merchant_id then
    return jsonb_build_object('ok', false, 'error', 'other_merchant');
  end if;
  if v_claim.redeemed_at is not null then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed', 'redeemed_at', v_claim.redeemed_at,
                              'title', v_claim.title);
  end if;
  if v_claim.valid_until < now() then
    return jsonb_build_object('ok', false, 'error', 'expired', 'title', v_claim.title);
  end if;

  update public.coupon_claims
     set redeemed_at = now(), redeemed_by_merchant_id = v.merchant_id
   where id = v_claim.id and redeemed_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed', 'title', v_claim.title);
  end if;

  perform public.bump_stat(v.merchant_id, 'redemptions');
  select redemptions into v_count from public.merchant_stats_daily
   where merchant_stats_daily.merchant_id = v.merchant_id and day = public.fair_today();

  return jsonb_build_object(
    'ok', true,
    'title', v_claim.title,
    -- Solo nombre e inicial del apellido: el comercio no recibe datos personales completos.
    'customer', trim(split_part(v_claim.full_name, ' ', 1) || ' ' ||
                     coalesce(left(nullif(split_part(v_claim.full_name, ' ', 2), ''), 1) || '.', '')),
    'redeemed_at', now(),
    'today_redemptions', coalesce(v_count, 0)
  );
end $$;

-- ---------------------------------------------------------------------------
-- Métricas públicas (vistas y clics) — sin sesión, solo contadores agregados
-- ---------------------------------------------------------------------------
create or replace function public.track_merchant(p_merchant_id uuid, p_metric text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_metric not in ('views', 'map_clicks', 'whatsapp_clicks') then
    raise exception 'invalid_metric';
  end if;
  if not exists (select 1 from public.merchants where id = p_merchant_id and is_published) then
    return;
  end if;
  perform public.bump_stat(p_merchant_id, p_metric);
end $$;

-- ---------------------------------------------------------------------------
-- Administración
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_merchant_pin(p_merchant_id uuid, p_pin text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_pin !~ '^[0-9]{4,8}$' then raise exception 'invalid_pin'; end if;
  update public.merchant_secrets
     set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')),
         failed_attempts = 0, locked_until = null
   where merchant_id = p_merchant_id;
end $$;

create or replace function public.admin_regenerate_merchant_link(p_merchant_id uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token text := encode(extensions.gen_random_bytes(18), 'hex');
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.merchant_secrets
     set validation_token = v_token, failed_attempts = 0, locked_until = null
   where merchant_id = p_merchant_id;
  return v_token;
end $$;

-- Indicadores del panel en una sola llamada.
create or replace function public.admin_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'users',               (select count(*) from public.profiles where role = 'visitor'),
    'users_today',         (select count(*) from public.profiles
                             where role = 'visitor' and (created_at at time zone 'America/Caracas')::date = public.fair_today()),
    'profiles_completed',  (select count(*) from public.profiles where profile_completed_at is not null),
    'merchants_active',    (select count(*) from public.merchants where is_published),
    'coupons_claimed',     (select count(*) from public.coupon_claims),
    'coupons_redeemed',    (select count(*) from public.coupon_claims where redeemed_at is not null),
    'municipalities',      (select count(distinct municipality) from public.profiles where municipality is not null),
    'by_municipality',     coalesce((select jsonb_agg(x order by x.total desc) from (
                              select municipality as label, count(*) as total from public.profiles
                               where municipality is not null group by municipality) x), '[]'::jsonb),
    'by_interest',         coalesce((select jsonb_agg(x order by x.total desc) from (
                              select i as label, count(*) as total from public.profiles, unnest(interests) i
                               group by i) x), '[]'::jsonb),
    'by_age',              coalesce((select jsonb_agg(x order by x.label) from (
                              select case
                                       when extract(year from now())::int - birth_year < 18 then 'Menos de 18'
                                       when extract(year from now())::int - birth_year < 25 then '18–24'
                                       when extract(year from now())::int - birth_year < 35 then '25–34'
                                       when extract(year from now())::int - birth_year < 45 then '35–44'
                                       when extract(year from now())::int - birth_year < 55 then '45–54'
                                       else '55 o más' end as label,
                                     count(*) as total
                                from public.profiles where birth_year is not null group by 1) x), '[]'::jsonb)
  );
end $$;

-- Lectura del enlace de validación (solo admin).
create or replace function public.admin_merchant_link(p_merchant_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return (select jsonb_build_object('token', validation_token, 'has_pin', pin_hash is not null,
                                    'locked_until', locked_until)
            from public.merchant_secrets where merchant_id = p_merchant_id);
end $$;

-- Permisos de ejecución: Supabase concede EXECUTE a anon/authenticated por defecto,
-- así que se revoca todo y se concede solo lo necesario.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin()                                to anon, authenticated;
grant execute on function public.fair_today()                              to anon, authenticated;
grant execute on function public.track_merchant(uuid, text)                to anon, authenticated;
grant execute on function public.merchant_portal(text, text)               to anon, authenticated;
grant execute on function public.redeem_coupon(text, text, text)           to anon, authenticated;
grant execute on function public.accept_terms(text, text, text)            to authenticated;
grant execute on function public.complete_profile(text, int, text[])       to authenticated;
grant execute on function public.set_marketing_opt_out(boolean)            to authenticated;
grant execute on function public.claim_coupon(uuid)                        to authenticated;
grant execute on function public.admin_set_merchant_pin(uuid, text)        to authenticated;
grant execute on function public.admin_regenerate_merchant_link(uuid)      to authenticated;
grant execute on function public.admin_summary()                           to authenticated;
grant execute on function public.admin_merchant_link(uuid)                 to authenticated;
