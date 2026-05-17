# DompetKu Pro - Capacitor Clone

Wrapper Android untuk project React utama tanpa mengubah arsitektur web yang sudah ada.

## Tujuan

- mempertahankan app React sebagai source of truth
- membungkus hasil build `dist/` ke shell Android via Capacitor
- memisahkan eksperimen APK dari app web utama

## Struktur

```text
dompetku-react/
├── dist/                  # hasil build React utama
└── capacitor-clone/
    ├── capacitor.config.ts
    ├── package.json
    ├── scripts/
    │   └── sync-web.ps1
    └── www/               # hasil copy dari ../dist saat sync
```

## Langkah pakai

### 1. Build app React utama

Jalankan dari root project:

```bash
npm run build
```

Jika build ini ditujukan untuk APK, set redirect auth lebih dulu:

```bash
$env:VITE_AUTH_REDIRECT_URL='https://localhost'
npm run build
```

### 2. Install dependency Capacitor

Masuk ke folder wrapper:

```bash
cd capacitor-clone
npm install
```

### 3. Tambahkan platform Android

```bash
npx cap add android
```

Perintah ini akan membuat folder `android/`.

### 4. Salin hasil web dan sync

```bash
npm run cap:sync
```

Script ini akan:

1. menyalin `../dist` ke `./www`
2. menjalankan `npx cap sync android`

### 5. Buka Android Studio

```bash
npm run cap:open
```

Lalu build APK dari Android Studio.

## Workflow harian

Setelah ada perubahan di app React:

1. dari root project jalankan:

```bash
npm run build
```

2. lalu dari `capacitor-clone` jalankan:

```bash
npm run cap:sync
```

## Live reload Android

Kalau kamu sedang polishing UI Android dan tidak mau build penuh setiap kali, pakai mode live reload.

### Untuk emulator Android

1. dari root project jalankan server Vite yang bisa diakses emulator:

```cmd
cd /d "D:\Pindah X550JX\Projek Portofolio\dompetku-react"
set VITE_AUTH_REDIRECT_URL=https://localhost
npm run dev:android
```

2. di terminal lain, masuk ke wrapper:

```cmd
cd /d "D:\Pindah X550JX\Projek Portofolio\dompetku-react\capacitor-clone"
npm run cap:sync:live
```

3. lalu buka / run project Android:

```cmd
npm run cap:open
```

atau langsung:

```cmd
npm run cap:run:live
```

Mode ini memakai:

- `http://10.0.2.2:5173` untuk emulator Android
- source React utama yang sama, jadi tidak perlu pisah codebase

Kalau Vite sedang hidup, perubahan UI biasanya akan ikut update jauh lebih cepat daripada workflow build-copy-sync biasa.

### Kapan pakai live reload

Pakai ini saat:

- ngulik tampilan Android
- cek spacing, safe area, transaksi, dashboard, login, landing

Balik ke workflow `build -> cap:sync` saat:

- mau test APK yang benar-benar final
- mau memastikan assets statis dan config production aman

## Catatan penting

### Supabase Auth

Login email/password akan tetap paling aman untuk fase awal wrapper ini.

Sebelum menguji APK, tambahkan `https://localhost` ke:

- `Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs`

Project web utama sekarang bisa override redirect auth lewat:

```bash
VITE_AUTH_REDIRECT_URL=https://localhost
```

Jika nanti ingin OAuth seperti Google:

- redirect URL Supabase perlu disesuaikan
- deep link Android perlu ditambahkan
- event `appUrlOpen` dari plugin `@capacitor/app` perlu di-handle

Jadi untuk MVP APK, sebaiknya fokus dulu ke:

- email/password
- shared account
- transaksi
- laporan
- export/share ringan

### Kenapa dipisah dari root?

Karena ini lebih aman untuk eksperimen mobile:

- app web tetap stabil
- wrapper APK bisa diubah tanpa merusak source utama
- nanti kalau mau pindah ke React Native atau Flutter, jalurnya tetap bersih
