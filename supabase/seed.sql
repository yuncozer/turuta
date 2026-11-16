-- Generado por scripts/gen-seed.ts — no editar a mano.
-- Datos de ejemplo para desarrollo y la Beta. PIN de validación de todos los comercios: 1234.

insert into public.categories (slug, name, kind, sort_order) values
  ('comida', 'Comida', 'comercio', 1),
  ('bebidas', 'Bebidas', 'comercio', 2),
  ('infantil', 'Infantil', 'comercio', 3),
  ('servicios', 'Servicios', 'comercio', 4),
  ('ventas', 'Ventas', 'comercio', 5),
  ('toros', 'Toros', 'evento', 1),
  ('conciertos', 'Conciertos', 'evento', 2),
  ('deportes', 'Deportes', 'evento', 3),
  ('cultura', 'Cultura', 'evento', 4),
  ('exposiciones', 'Exposiciones', 'evento', 5)
on conflict do nothing;

insert into public.merchants (id, slug, name, category, description, maps_url, lat, lng, location_label, whatsapp, instagram, opening_hours, opens_at, closes_at, plan, popular_rank, is_published) values
  ('00000000-0000-4000-8000-000000000001', 'pizzeria-antonio', 'Pizzería Antonio', 'comida', 'Pizzas al horno de leña y pastas caseras. Zona gastronómica de Pueblo Nuevo.', null, 7.7853, -72.2148, 'Pueblo Nuevo, stand 4', '584140000001', null, '12:00 m – 11:00 pm', '12:00', '23:00', 'premium', 1, true),
  ('00000000-0000-4000-8000-000000000002', 'parque-mundo-feria', 'Parque Mundo Feria', 'infantil', 'Atracciones mecánicas, inflables y juegos para toda la familia.', null, 7.7841, -72.2131, 'Recinto ferial, área infantil', '584140000002', null, '3:00 pm – 11:00 pm', '15:00', '23:00', 'premium', 2, true),
  ('00000000-0000-4000-8000-000000000003', 'hamburguesas-daniel', 'Hamburguesas Daniel', 'comida', 'Hamburguesas artesanales a la parrilla, papas rústicas y malteadas. Stand 12, zona gastronómica de Asogata.', null, 7.7759, -72.2217, 'Asogata, stand 12', '584140000003', 'hamburguesasdaniel', '11:00 am – 11:00 pm', '11:00', '23:00', 'destacado', 3, true),
  ('00000000-0000-4000-8000-000000000004', 'cerveceria-andina', 'Cervecería Andina', 'bebidas', 'Cerveza artesanal tachirense y picadas para compartir antes del concierto.', null, 7.7869, -72.2109, 'Polideportivo de Pueblo Nuevo, entrada principal', '584140000004', null, '4:00 pm – 2:00 am', '16:00', '02:00', 'basico', null, true),
  ('00000000-0000-4000-8000-000000000005', 'dulces-tipicos-la-abuela', 'Dulces Típicos La Abuela', 'ventas', 'Dulces andinos, pastelitos y café de altura para llevar.', null, 7.7672, -72.2251, 'Plaza Bolívar, toldo 3', '584140000005', null, '8:00 am – 9:00 pm', '08:00', '21:00', 'basico', null, true),
  ('00000000-0000-4000-8000-000000000006', 'farmacia-feria-24h', 'Farmacia Feria 24h', 'servicios', 'Medicinas, protector solar e hidratación. Abierta toda la noche durante la feria.', null, 7.7801, -72.2176, 'Av. España, frente al recinto', '584140000006', null, 'Abierto 24 horas', '00:00', '23:59', 'basico', null, true)
on conflict do nothing;

insert into public.events (id, title, category, venue, description, starts_at, ends_at, is_published) values
  ('00000000-0000-4000-9000-000000000001', 'Media Maratón San Sebastián', 'deportes', 'Plaza Bolívar', '', '2027-01-28T06:30:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000002', 'Expo Táchira', 'exposiciones', 'Pabellones Venezuela y Colombia', '', '2027-01-28T10:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000003', 'Corrida de toros', 'toros', 'Plaza Monumental de Pueblo Nuevo', '', '2027-01-28T16:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000004', 'Gran Parada de Campeones', 'cultura', 'Asogata', '', '2027-01-28T19:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000005', 'Concierto Gigante de la Feria', 'conciertos', 'Polideportivo de Pueblo Nuevo', '', '2027-01-28T20:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000006', 'Expo Táchira', 'exposiciones', 'Pabellones Venezuela y Colombia', '', '2027-01-29T10:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000007', 'Corrida de toros', 'toros', 'Plaza Monumental de Pueblo Nuevo', '', '2027-01-29T16:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000008', 'Noche de música llanera', 'conciertos', 'Concha acústica del Parque Metropolitano', '', '2027-01-29T20:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000009', 'Vuelta al Táchira en bicicleta — etapa urbana', 'deportes', 'Av. Libertador', '', '2027-01-30T08:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000010', 'Corrida de toros', 'toros', 'Plaza Monumental de Pueblo Nuevo', '', '2027-01-30T16:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000011', 'Coronación de la Reina de la Feria', 'cultura', 'Polideportivo de Pueblo Nuevo', '', '2027-01-30T20:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000012', 'Corrida de toros de clausura', 'toros', 'Plaza Monumental de Pueblo Nuevo', '', '2027-01-31T16:00:00-04:00', null, true),
  ('00000000-0000-4000-9000-000000000013', 'Concierto de cierre', 'conciertos', 'Polideportivo de Pueblo Nuevo', '', '2027-01-31T20:00:00-04:00', null, true)
on conflict do nothing;

insert into public.coupons (id, merchant_id, title, terms, kind, total_quota, valid_until, is_active) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-8000-000000000001', 'Pizza pequeña gratis', 'Por la compra de una pizza familiar. 1 por persona.', 'cupo', 100, '2027-01-31T23:59:00-04:00', true),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-8000-000000000002', '2x1 en atracciones', 'Válido de lunes a jueves en atracciones seleccionadas.', 'cupo', 200, '2027-01-31T23:59:00-04:00', true),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-8000-000000000003', '2x1 en hamburguesa clásica', '1 por persona.', 'cupo', 60, '2027-01-31T23:59:00-04:00', true),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-8000-000000000004', '10 % mostrando la app', 'Promoción abierta para usuarios registrados. Muestra tu código en caja.', 'abierta', null, '2027-02-15T23:59:00-04:00', true)
on conflict do nothing;

update public.merchant_secrets set pin_hash = extensions.crypt('1234', extensions.gen_salt('bf')) where pin_hash is null;

insert into public.settings (key, value) values
  ('privacy_version', '"2026-11"'),
  ('soft_gate_views', '5')
on conflict do nothing;
