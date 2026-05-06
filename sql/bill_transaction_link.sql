-- ============================================================
-- DompetKu Pro - Relasi Tagihan <-> Transaksi Pembayaran
-- Jalankan di Supabase Dashboard > SQL Editor.
--
-- Tujuan:
-- 1. transaksi.bill_id menyimpan tagihan yang dibayar.
-- 2. tagihan.source_bill_id menandai tagihan bulan depan yang dibuat otomatis
--    dari pembayaran tagihan bulan ini.
-- ============================================================

ALTER TABLE transaksi
  ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES tagihan(id) ON DELETE SET NULL;

ALTER TABLE tagihan
  ADD COLUMN IF NOT EXISTS source_bill_id UUID REFERENCES tagihan(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transaksi_bill_id
  ON transaksi(bill_id);

CREATE INDEX IF NOT EXISTS idx_tagihan_source_bill_id
  ON tagihan(source_bill_id);
