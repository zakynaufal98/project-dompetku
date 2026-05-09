-- Jalankan di Supabase SQL Editor

-- Tabel untuk menyimpan kategori custom yang ditambahkan user
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  main_cat TEXT NOT NULL,
  sub_cats TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, type, main_cat)
);

ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own custom categories"
ON user_categories FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tabel untuk menyimpan kategori default yang disembunyikan user
CREATE TABLE IF NOT EXISTS user_hidden_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  main_cat TEXT NOT NULL,
  UNIQUE(user_id, type, main_cat)
);

ALTER TABLE user_hidden_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hidden categories"
ON user_hidden_categories FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
