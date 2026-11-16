-- FISS 2027 · Esquema base
-- Tablas, tipos y disparadores. Las políticas RLS están en la migración siguiente
-- y las funciones de negocio (cupones, validación, métricas) en la tercera.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------------
create table public.categories (
  slug       text primary key,
  name       text not null,
  kind       text not null check (kind in ('comercio', 'evento')),
  sort_order int  not null default 0
);

create table public.settings (
  key   text primary key,
  value jsonb not null
);

-- ---------------------------------------------------------------------------
-- Comercios
-- ---------------------------------------------------------------------------
create type public.merchant_plan as enum ('basico', 'destacado', 'premium');

create table public.merchants (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text not null,
  category       text not null references public.categories (slug) on update cascade,
  description    text not null default '',
  logo_url       text,
  banner_url     text,
  maps_url       text,
  lat            double precision,
  lng            double precision,
  location_label text not null default '',
  whatsapp       text,
  instagram      text,
  opening_hours  text not null default '',
  opens_at       time,
  closes_at      time,
  plan           public.merchant_plan not null default 'basico',
  popular_rank   int,
  is_published   boolean not null default false,
  report_email   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index merchants_published_idx on public.merchants (is_published, category);

-- Datos sensibles del modo comercio, separados para que nunca viajen al público.
create table public.merchant_secrets (
  merchant_id      uuid primary key references public.merchants (id) on delete cascade,
  validation_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  pin_hash         text,
  failed_attempts  int not null default 0,
  locked_until     timestamptz
);

-- ---------------------------------------------------------------------------
-- Cronograma
-- ---------------------------------------------------------------------------
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text not null references public.categories (slug) on update cascade,
  venue        text not null default '',
  description  text not null default '',
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);
create index events_starts_idx on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- Cupones
-- ---------------------------------------------------------------------------
create table public.coupons (
  id          uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  title       text not null,
  terms       text not null default '',
  kind        text not null default 'cupo' check (kind in ('cupo', 'abierta')),
  total_quota int check (total_quota is null or total_quota >= 0),
  remaining   int check (remaining is null or remaining >= 0),
  valid_until timestamptz not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint coupons_quota_kind check (
    (kind = 'cupo' and total_quota is not null) or (kind = 'abierta' and total_quota is null)
  )
);
create index coupons_merchant_idx on public.coupons (merchant_id);

-- ---------------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text,
  full_name            text not null default '',
  whatsapp             text,
  municipality         text,
  birth_year           int check (birth_year is null or birth_year between 1900 and 2026),
  interests            text[] not null default '{}',
  role                 text not null default 'visitor' check (role in ('visitor', 'admin')),
  consent_at           timestamptz,
  consent_version      text,
  opted_out_at         timestamptz,
  profile_completed_at timestamptz,
  created_at           timestamptz not null default now()
);

create table public.coupon_claims (
  id                      uuid primary key default gen_random_uuid(),
  coupon_id               uuid not null references public.coupons (id) on delete cascade,
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  code                    text not null unique,
  claimed_at              timestamptz not null default now(),
  redeemed_at             timestamptz,
  redeemed_by_merchant_id uuid references public.merchants (id) on delete set null,
  unique (coupon_id, user_id)
);
create index coupon_claims_user_idx on public.coupon_claims (user_id);

-- ---------------------------------------------------------------------------
-- Métricas agregadas por día (una fila por comercio y día)
-- ---------------------------------------------------------------------------
create table public.merchant_stats_daily (
  merchant_id     uuid not null references public.merchants (id) on delete cascade,
  day             date not null,
  views           int not null default 0,
  map_clicks      int not null default 0,
  whatsapp_clicks int not null default 0,
  claims          int not null default 0,
  redemptions     int not null default 0,
  primary key (merchant_id, day)
);

-- ---------------------------------------------------------------------------
-- Disparadores
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger merchants_touch before update on public.merchants
  for each row execute function public.touch_updated_at();

-- Cada comercio nuevo recibe su enlace de validación.
create or replace function public.create_merchant_secret()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.merchant_secrets (merchant_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger merchants_secret after insert on public.merchants
  for each row execute function public.create_merchant_secret();

-- Cupos: al crear, remaining = total; al cambiar el total, se recalcula con lo ya entregado.
create or replace function public.coupons_sync_remaining()
returns trigger language plpgsql as $$
declare
  v_claimed int;
begin
  if new.kind = 'abierta' then
    new.total_quota := null;
    new.remaining := null;
  elsif tg_op = 'INSERT' then
    new.remaining := new.total_quota;
  elsif new.total_quota is distinct from old.total_quota or old.kind <> new.kind then
    select count(*) into v_claimed from public.coupon_claims where coupon_id = new.id;
    new.remaining := greatest(new.total_quota - v_claimed, 0);
  end if;
  return new;
end $$;

create trigger coupons_remaining before insert or update on public.coupons
  for each row execute function public.coupons_sync_remaining();

-- Perfil creado al registrarse. Los metadatos llegan desde el formulario de registro.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, full_name, whatsapp, consent_at, consent_version)
  values (
    new.id,
    new.email,
    coalesce(meta ->> 'full_name', meta ->> 'name', ''),
    nullif(meta ->> 'whatsapp', ''),
    case when (meta ->> 'consent_version') is not null then now() end,
    meta ->> 'consent_version'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
