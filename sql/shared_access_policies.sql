-- ============================================================
-- DompetKu Pro - Shared Account RLS Policies
-- Jalankan di Supabase Dashboard > SQL Editor.
-- Policy ini membuat member accepted bisa melihat data owner,
-- dan role editor bisa menambah/mengubah/menghapus data owner.
-- ============================================================

CREATE TABLE IF NOT EXISTS shared_accounts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_email   TEXT,
  member_email  TEXT,
  role          TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, member_id)
);

ALTER TABLE shared_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shared_accounts_select" ON shared_accounts;
DROP POLICY IF EXISTS "shared_accounts_insert" ON shared_accounts;
DROP POLICY IF EXISTS "shared_accounts_update" ON shared_accounts;
DROP POLICY IF EXISTS "shared_accounts_delete" ON shared_accounts;

CREATE POLICY "shared_accounts_select"
  ON shared_accounts FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = member_id);

CREATE POLICY "shared_accounts_insert"
  ON shared_accounts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "shared_accounts_update"
  ON shared_accounts FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = member_id);

CREATE POLICY "shared_accounts_delete"
  ON shared_accounts FOR DELETE
  USING (auth.uid() = owner_id OR auth.uid() = member_id);

CREATE OR REPLACE FUNCTION can_view_owner(owner_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT
    auth.uid() = owner_uuid
    OR EXISTS (
      SELECT 1
      FROM shared_accounts
      WHERE owner_id = owner_uuid
        AND member_id = auth.uid()
        AND status = 'accepted'
    );
$$;

CREATE OR REPLACE FUNCTION can_edit_owner(owner_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT
    auth.uid() = owner_uuid
    OR EXISTS (
      SELECT 1
      FROM shared_accounts
      WHERE owner_id = owner_uuid
        AND member_id = auth.uid()
        AND status = 'accepted'
        AND role = 'editor'
    );
$$;

DROP POLICY IF EXISTS "transaksi_select" ON transaksi;
DROP POLICY IF EXISTS "transaksi_insert" ON transaksi;
DROP POLICY IF EXISTS "transaksi_update" ON transaksi;
DROP POLICY IF EXISTS "transaksi_delete" ON transaksi;

CREATE POLICY "transaksi_select" ON transaksi FOR SELECT USING (can_view_owner(user_id));
CREATE POLICY "transaksi_insert" ON transaksi FOR INSERT WITH CHECK (can_edit_owner(user_id));
CREATE POLICY "transaksi_update" ON transaksi FOR UPDATE USING (can_edit_owner(user_id));
CREATE POLICY "transaksi_delete" ON transaksi FOR DELETE USING (can_edit_owner(user_id));

DROP POLICY IF EXISTS "investasi_select" ON investasi;
DROP POLICY IF EXISTS "investasi_insert" ON investasi;
DROP POLICY IF EXISTS "investasi_update" ON investasi;
DROP POLICY IF EXISTS "investasi_delete" ON investasi;

CREATE POLICY "investasi_select" ON investasi FOR SELECT USING (can_view_owner(user_id));
CREATE POLICY "investasi_insert" ON investasi FOR INSERT WITH CHECK (can_edit_owner(user_id));
CREATE POLICY "investasi_update" ON investasi FOR UPDATE USING (can_edit_owner(user_id));
CREATE POLICY "investasi_delete" ON investasi FOR DELETE USING (can_edit_owner(user_id));

DROP POLICY IF EXISTS "tagihan_select" ON tagihan;
DROP POLICY IF EXISTS "tagihan_insert" ON tagihan;
DROP POLICY IF EXISTS "tagihan_update" ON tagihan;
DROP POLICY IF EXISTS "tagihan_delete" ON tagihan;

CREATE POLICY "tagihan_select" ON tagihan FOR SELECT USING (can_view_owner(user_id));
CREATE POLICY "tagihan_insert" ON tagihan FOR INSERT WITH CHECK (can_edit_owner(user_id));
CREATE POLICY "tagihan_update" ON tagihan FOR UPDATE USING (can_edit_owner(user_id));
CREATE POLICY "tagihan_delete" ON tagihan FOR DELETE USING (can_edit_owner(user_id));

DROP POLICY IF EXISTS "wallets_select" ON wallets;
DROP POLICY IF EXISTS "wallets_insert" ON wallets;
DROP POLICY IF EXISTS "wallets_update" ON wallets;
DROP POLICY IF EXISTS "wallets_delete" ON wallets;

CREATE POLICY "wallets_select" ON wallets FOR SELECT USING (can_view_owner(user_id));
CREATE POLICY "wallets_insert" ON wallets FOR INSERT WITH CHECK (can_edit_owner(user_id));
CREATE POLICY "wallets_update" ON wallets FOR UPDATE USING (can_edit_owner(user_id));
CREATE POLICY "wallets_delete" ON wallets FOR DELETE USING (can_edit_owner(user_id));

DROP POLICY IF EXISTS "target_finansial_select" ON target_finansial;
DROP POLICY IF EXISTS "target_finansial_insert" ON target_finansial;
DROP POLICY IF EXISTS "target_finansial_update" ON target_finansial;
DROP POLICY IF EXISTS "target_finansial_delete" ON target_finansial;

CREATE POLICY "target_finansial_select" ON target_finansial FOR SELECT USING (can_view_owner(user_id));
CREATE POLICY "target_finansial_insert" ON target_finansial FOR INSERT WITH CHECK (can_edit_owner(user_id));
CREATE POLICY "target_finansial_update" ON target_finansial FOR UPDATE USING (can_edit_owner(user_id));
CREATE POLICY "target_finansial_delete" ON target_finansial FOR DELETE USING (can_edit_owner(user_id));

CREATE INDEX IF NOT EXISTS idx_shared_accounts_member_status
  ON shared_accounts(member_id, status);

CREATE INDEX IF NOT EXISTS idx_shared_accounts_owner_status
  ON shared_accounts(owner_id, status);
