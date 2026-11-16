#!/usr/bin/env bash
# Aplica las migraciones sobre un Postgres local vacío (con stub de Supabase) y corre las pruebas.
# Uso: supabase/tests/run.sh   (requiere psql y permisos para crear bases de datos)
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${DB:-fiss_test}"

dropdb --if-exists "$DB"
createdb "$DB"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$DB")

"${PSQL[@]}" -f tests/supabase_stub.sql
for f in migrations/*.sql; do
  # El bucket de imágenes depende del esquema storage de Supabase.
  [[ "$f" == *storage.sql ]] && continue
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f seed.sql
"${PSQL[@]}" -f tests/business_rules.sql
bash tests/concurrency.sh "$DB"
