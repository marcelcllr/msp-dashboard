-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- (una sola vez para crear la tabla)

CREATE TABLE IF NOT EXISTS msp_store (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permitir acceso público (con anon key)
ALTER TABLE msp_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON msp_store
  FOR ALL USING (true) WITH CHECK (true);
