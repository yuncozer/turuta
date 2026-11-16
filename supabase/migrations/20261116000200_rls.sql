-- FISS 2027 · Seguridad por fila (RLS)
-- Regla general: el público solo lee contenido publicado; cada visitante solo ve lo suyo;
-- las escrituras de visitantes y comercios pasan por funciones (migración siguiente).

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.categories           enable row level security;
alter table public.settings             enable row level security;
alter table public.merchants            enable row level security;
alter table public.merchant_secrets     enable row level security;
alter table public.events               enable row level security;
alter table public.coupons              enable row level security;
alter table public.profiles             enable row level security;
alter table public.coupon_claims        enable row level security;
alter table public.merchant_stats_daily enable row level security;

-- Catálogos y ajustes: lectura pública, escritura admin.
create policy categories_read on public.categories for select using (true);
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy settings_read on public.settings for select using (true);
create policy settings_admin on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- Comercios publicados: lectura pública.
create policy merchants_read on public.merchants for select using (is_published or public.is_admin());
create policy merchants_admin on public.merchants for all using (public.is_admin()) with check (public.is_admin());

-- Secretos del comercio: solo admin.
create policy merchant_secrets_admin on public.merchant_secrets for all using (public.is_admin()) with check (public.is_admin());

-- Cronograma.
create policy events_read on public.events for select using (is_published or public.is_admin());
create policy events_admin on public.events for all using (public.is_admin()) with check (public.is_admin());

-- Cupones activos de comercios publicados.
create policy coupons_read on public.coupons for select using (
  public.is_admin()
  or (is_active and exists (select 1 from public.merchants m where m.id = merchant_id and m.is_published))
);
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- Perfiles: cada quien lee el suyo; admin lee todos. Las escrituras van por funciones.
create policy profiles_read_own on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- Cupones obtenidos: cada quien ve los suyos; admin ve todos. Sin escritura directa.
create policy coupon_claims_read_own on public.coupon_claims for select using (user_id = auth.uid() or public.is_admin());

-- Métricas: solo admin.
create policy stats_admin_read on public.merchant_stats_daily for select using (public.is_admin());

-- Reporte por comercio (respeta la RLS de quien consulta).
create view public.merchant_report with (security_invoker = true) as
select
  m.id   as merchant_id,
  m.name,
  m.plan,
  m.report_email,
  coalesce(sum(s.views), 0)::int           as views,
  coalesce(sum(s.map_clicks), 0)::int      as map_clicks,
  coalesce(sum(s.whatsapp_clicks), 0)::int as whatsapp_clicks,
  coalesce(sum(s.claims), 0)::int          as claims,
  coalesce(sum(s.redemptions), 0)::int     as redemptions
from public.merchants m
left join public.merchant_stats_daily s on s.merchant_id = m.id
group by m.id;

-- Privilegios: anon/authenticated no escriben directamente en tablas de visitantes.
revoke insert, update, delete on public.coupon_claims, public.merchant_stats_daily from anon, authenticated;
revoke insert, delete on public.profiles from anon, authenticated;
