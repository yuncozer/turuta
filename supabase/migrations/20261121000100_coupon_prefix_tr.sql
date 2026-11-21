-- Tú Ruta · Prefijo de los códigos de cupón: TR-XXXX-XX (antes FISS-XXXX-XX).
-- Los cupones ya entregados conservan su código; los nuevos usan el prefijo TR-.

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
  return 'TR-' || substr(raw, 1, 4) || '-' || substr(raw, 5, 2);
end $$;

revoke execute on function public.generate_coupon_code() from public, anon, authenticated;
