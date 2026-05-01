-- ====================================================
-- MIGRATION: SISTEM ANGGARAN & TRANSAKSI BERULANG
-- Jalankan script ini di SQL Editor Supabase Anda
-- ====================================================

-- 1. Tabel Anggaran Bulanan (Budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category) -- Satu user hanya punya 1 budget per kategori
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Tabel Transaksi Berulang (Recurring)
CREATE TABLE IF NOT EXISTS public.recurring_tx (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    desc_text TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    tx_type TEXT NOT NULL, -- 'in' / 'out'
    cat TEXT NOT NULL,
    sub_cat TEXT,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'yearly'
    next_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recurring_tx ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring tx"
    ON public.recurring_tx FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring tx"
    ON public.recurring_tx FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring tx"
    ON public.recurring_tx FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring tx"
    ON public.recurring_tx FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger Update Timestamp untuk Budgets
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_budgets
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

-- Note: Jika Shared Account ingin mengakses budgets/recurring_tx, 
-- Anda perlu menambahkan RLS policies serupa seperti di shared_access_policies.sql
