-- ============================================================
-- DompetKu Pro - Supabase Schema (versi terbaru)
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: transaksi
CREATE TABLE IF NOT EXISTS transaksi (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keterangan  TEXT NOT NULL,
  amount      NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  tipe        TEXT NOT NULL CHECK (tipe IN ('in','out')),
  cat         TEXT NOT NULL DEFAULT 'Lainnya',
  tgl         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: investasi (dengan sub_type, unit, qty)
CREATE TABLE IF NOT EXISTS investasi (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inv_type    TEXT NOT NULL CHECK (inv_type IN ('Reksadana','Saham','Emas','Uang')),
  sub_type    TEXT,
  keterangan  TEXT NOT NULL,
  amount      NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  action      TEXT NOT NULL CHECK (action IN ('beli','jual')),
  unit        TEXT DEFAULT '',
  qty         NUMERIC(15,4) DEFAULT 0,
  tgl         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE investasi ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (hindari error duplikat)
DROP POLICY IF EXISTS "transaksi_select" ON transaksi;
DROP POLICY IF EXISTS "transaksi_insert" ON transaksi;
DROP POLICY IF EXISTS "transaksi_delete" ON transaksi;
DROP POLICY IF EXISTS "transaksi_update" ON transaksi;
DROP POLICY IF EXISTS "investasi_select" ON investasi;
DROP POLICY IF EXISTS "investasi_insert" ON investasi;
DROP POLICY IF EXISTS "investasi_delete" ON investasi;
DROP POLICY IF EXISTS "investasi_update" ON investasi;

CREATE POLICY "transaksi_select" ON transaksi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transaksi_insert" ON transaksi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transaksi_delete" ON transaksi FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "transaksi_update" ON transaksi FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investasi_select" ON investasi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "investasi_insert" ON investasi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "investasi_delete" ON investasi FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "investasi_update" ON investasi FOR UPDATE USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_transaksi_user_tgl ON transaksi(user_id, tgl DESC);
CREATE INDEX IF NOT EXISTS idx_transaksi_tipe     ON transaksi(user_id, tipe);
CREATE INDEX IF NOT EXISTS idx_investasi_user_tgl ON investasi(user_id, tgl DESC);
CREATE INDEX IF NOT EXISTS idx_investasi_invtype  ON investasi(user_id, inv_type);

-- Jika tabel investasi SUDAH ADA sebelumnya, jalankan ini untuk tambah kolom baru:
-- ALTER TABLE investasi ADD COLUMN IF NOT EXISTS sub_type TEXT;
-- ALTER TABLE investasi ADD COLUMN IF NOT EXISTS unit     TEXT DEFAULT '';
-- ALTER TABLE investasi ADD COLUMN IF NOT EXISTS qty      NUMERIC(15,4) DEFAULT 0;
