# DompetKu Pro — React Edition 🏆

Aplikasi catatan keuangan modern dengan **Vite + React 18 + Tailwind CSS + Supabase**.
UI clean & elegan, fully responsive (mobile, tablet, desktop).

---

## 📁 Struktur Project

```
dompetku-react/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example          ← Salin ke .env lalu isi Anon Key
├── .gitignore
├── sql/
│   └── schema.sql        ← ⚠️ Jalankan ini di Supabase SQL Editor
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── lib/
    │   ├── supabase.js
    │   └── utils.js
    ├── context/
    │   ├── AuthContext.jsx
    │   └── DataContext.jsx
    ├── components/
    │   ├── Sidebar.jsx
    │   └── UI.jsx
    └── pages/
        ├── AuthPage.jsx
        ├── Dashboard.jsx
        ├── Transaksi.jsx
        ├── Investasi.jsx
        ├── Bulanan.jsx
        ├── Tahunan.jsx
        └── Grafik.jsx
```

---

## 🚀 Setup Lengkap

### Step 1 — Jalankan SQL Schema
1. Buka https://supabase.com/dashboard/project/psgrlzdscsgtszbbhusb/sql
2. Klik **New Query**
3. Copy seluruh isi `sql/schema.sql` → Paste → **Run**

> Jika tabel investasi sudah ada dari versi sebelumnya, jalankan juga:
> ```sql
> ALTER TABLE investasi ADD COLUMN IF NOT EXISTS sub_type TEXT;
> ALTER TABLE investasi ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '';
> ALTER TABLE investasi ADD COLUMN IF NOT EXISTS qty NUMERIC(15,4) DEFAULT 0;
> ```

### Step 2 — Buat file .env
```bash
cp .env.example .env
```
Isi `VITE_SUPABASE_ANON_KEY` dengan anon key dari:
**Supabase Dashboard → Project Settings → API → anon public**

### Step 3 — Install & Jalankan
```bash
npm install
npm run dev
```
Buka browser → http://localhost:5173

### Step 4 — Build Production
```bash
npm run build
```
Upload folder `dist/` ke Netlify / Vercel / hosting manapun.

---

## 📱 Responsive Layout

| Device       | Layout                                      |
|--------------|---------------------------------------------|
| Mobile       | Top bar + bottom navigation bar             |
| Tablet       | Icon-only sidebar kiri (64px)               |
| Desktop      | Full sidebar (224px), bisa collapse ke 64px |

## 🎨 Fitur Investasi

Setiap jenis investasi punya dropdown sub-tipe & satuan:

| Jenis       | Sub-tipe                          | Satuan |
|-------------|-----------------------------------|--------|
| Saham       | BBCA, BBRI, BMRI, TLKM, dll       | Lot    |
| Reksadana   | Pasar Uang, Saham, Indeks, dll    | Unit   |
| Emas        | Antam, UBS, Pegadaian, Digital    | Gram   |
| Uang        | Deposito, ORI, Sukuk, P2P, dll    | Nominal|
