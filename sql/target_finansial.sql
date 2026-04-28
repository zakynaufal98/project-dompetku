-- ============================================================
-- DompetKu Pro - Target Finansial Cerdas
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS target_finansial (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(15,2) NOT NULL CHECK (target_amount >= 0),
  saved_amount   NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  monthly_boost  NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (monthly_boost >= 0),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE target_finansial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "target_finansial_select" ON target_finansial;
DROP POLICY IF EXISTS "target_finansial_insert" ON target_finansial;
DROP POLICY IF EXISTS "target_finansial_delete" ON target_finansial;
DROP POLICY IF EXISTS "target_finansial_update" ON target_finansial;

CREATE POLICY "target_finansial_select"
  ON target_finansial FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "target_finansial_insert"
  ON target_finansial FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "target_finansial_delete"
  ON target_finansial FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "target_finansial_update"
  ON target_finansial FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_target_finansial_user_updated
  ON target_finansial(user_id, updated_at DESC);
