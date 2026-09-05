# Kasbon App

Kasbon App adalah aplikasi web sederhana untuk mencatat utang-piutang pribadi. Aplikasi ini dibuat untuk kebutuhan hiring task dengan fokus pada auth, keamanan data per user menggunakan Supabase RLS, business logic kasbon, dan UI dashboard yang nyaman dipakai.

## Tech Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- Supabase PostgreSQL + Auth
- Lucide React

## Features

- Signup, login, dan logout menggunakan email/password Supabase Auth.
- Dashboard `/` diproteksi, hanya bisa diakses user yang sudah login.
- CRUD catatan kasbon melalui API route:
    - `GET /api/debts`
    - `POST /api/debts`
    - `PATCH /api/debts/[id]`
    - `DELETE /api/debts/[id]`
- Summary cards:
    - Total dihutang ke saya
    - Total saya hutang
    - Net
- Format nominal menggunakan Rupiah Indonesia.
- Status kasbon memakai `settled_at`:
    - `null` berarti belum lunas
    - ada timestamp berarti sudah lunas
- Aksi tandai lunas dan buka lagi.
- Edit dan delete otomatis disembunyikan untuk data yang sudah lunas.
- Filter berdasarkan status dan tipe.
- Search berdasarkan nama orang.
- Sort berdasarkan jumlah dan tanggal.
- Chart sederhana untuk membandingkan total dihutang vs total hutang.
- Empty state, loading state, dan error state.
- Layout responsive dengan perhatian khusus untuk mobile.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Buat file `.env.local` di root project, lalu isi:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

Project URL dan anon/publishable key bisa diambil dari Supabase Dashboard pada menu Project Settings atau API Keys.

### 3. Database Migration

Migration database tersedia di:

```text
supabase/migrations/202609050001_create_debts.sql
```

Migration ini membuat:

- enum `public.debt_type` dengan nilai `owed_to_me` dan `i_owe`
- table `public.debts`
- trigger `updated_at`
- Row Level Security
- policy SELECT, INSERT, UPDATE, DELETE untuk data milik user sendiri

Jika menjalankan manual lewat Supabase SQL Editor, copy isi file migration tersebut dan run di project Supabase yang digunakan.

### 4. Run Locally

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

### 5. Build Check

```bash
npm run lint
npm run build
```

## Database

Table utama:

```text
public.debts
```

Kolom penting:

- `id`: primary key UUID
- `user_id`: relasi ke `auth.users`
- `type`: `owed_to_me` atau `i_owe`
- `counterpart_name`: nama orang
- `amount`: jumlah dalam Rupiah
- `note`: catatan opsional, maksimal 200 karakter
- `due_date`: tanggal kasbon
- `settled_at`: status lunas
- `created_at` dan `updated_at`: timestamp audit

## RLS Testing

RLS diuji menggunakan dua akun berbeda:

- User A: pemilik data
- User B: user lain yang mencoba membaca atau mengubah data User A

Evidence screenshot disimpan di folder repo:

```text
docs/rls-evidence
```

Test yang dilakukan:

- User B tidak bisa SELECT debt milik User A, hasilnya `[]`.
- User B tidak bisa UPDATE debt milik User A, data tetap tidak berubah saat dicek oleh User A.
- User B tidak bisa DELETE debt milik User A, data tetap masih ada saat dicek oleh User A.
- User B tidak bisa INSERT debt dengan `user_id` milik User A, hasilnya `403 Forbidden`.

Ringkasan evidence:

| Scenario                           | Actor                                      | Expected Result                 | Status |
| ---------------------------------- | ------------------------------------------ | ------------------------------- | ------ |
| SELECT data user lain              | User B membaca debt milik User A           | `[]`                            | Passed |
| INSERT data ke `user_id` user lain | User B insert debt dengan `user_id` User A | `403 Forbidden`                 | Passed |
| UPDATE data user lain              | User B mengubah note debt milik User A     | Data User A tetap tidak berubah | Passed |
| DELETE data user lain              | User B menghapus debt milik User A         | Data User A tetap masih ada     | Passed |

Evidence files:

- [Setup persiapan test RLS](docs/rls-evidence/Setup%20persiapan%20test%20RLS.png)
- [Data user andibeiber](docs/rls-evidence/Data%20user%20andibeiber.png)
- [Data user v99akun](docs/rls-evidence/Data%20user%20v99akun.png)
- [Ambil 1 data debts user andibeiber](docs/rls-evidence/Ambil%201%20data%20debts%20user%20andibeiber.png)
- [Coba select leak data user andibeiber dari user v99akun](docs/rls-evidence/Coba%20select%20leak%20data%20user%20andibeiber%20dari%20user%20v99akun.png)
- [Test Insert dari User v99akun ke user andibeiber](docs/rls-evidence/Test%20Insert%20dari%20User%20v99akun%20ke%20user%20andibeiber.png)
- [Select data yang tadi coba di insert](docs/rls-evidence/Select%20data%20yang%20tadi%20coba%20di%20insert.png)
- [Test update data User andibeiber menggunakan user v99akun](docs/rls-evidence/Test%20update%20data%20User%20andibeiber%20menggunakan%20user%20v99akun.png)
- [Test delete data User andibeiber menggunakan user v99akun](docs/rls-evidence/Test%20delete%20data%20User%20andibeiber%20menggunakan%20user%20v99akun.png)

Preview evidence utama:

![SELECT leak test](docs/rls-evidence/Coba%20select%20leak%20data%20user%20andibeiber%20dari%20user%20v99akun.png)

![INSERT leak test](docs/rls-evidence/Test%20Insert%20dari%20User%20v99akun%20ke%20user%20andibeiber.png)

![UPDATE leak test](docs/rls-evidence/Test%20update%20data%20User%20andibeiber%20menggunakan%20user%20v99akun.png)

![DELETE leak test](docs/rls-evidence/Test%20delete%20data%20User%20andibeiber%20menggunakan%20user%20v99akun.png)

Contoh test INSERT leak:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "$SUPABASE_URL/rest/v1/debts" `
  -Headers @{
    apikey = $ANON_KEY
    Authorization = "Bearer $TOKEN_B"
    Prefer = "return=representation"
  } `
  -ContentType "application/json" `
  -Body '{"user_id":"USER_A_ID","type":"owed_to_me","counterpart_name":"Insert Leak Test","amount":999000,"note":"USER B INSERT TO USER A"}'
```

Expected result:

```text
403 Forbidden
```

Verifikasi data tidak masuk:

```powershell
curl.exe "$SUPABASE_URL/rest/v1/debts?counterpart_name=eq.Insert%20Leak%20Test&select=*" `
  -H "apikey: $ANON_KEY" `
  -H "Authorization: Bearer $TOKEN_A"
```

Expected result:

```json
[]
```

## Approach

Auth dibuat dengan Supabase Auth dan session dijaga di server menggunakan `@supabase/ssr`. Route `/` diproteksi lewat `proxy.ts`, sehingga user yang belum login diarahkan ke `/login`.

Data kasbon diakses lewat API route Next.js, bukan langsung dari komponen UI. API route melakukan pengecekan user login, validasi input, dan query ke Supabase. RLS tetap menjadi lapisan keamanan utama di database agar data user tidak bocor walaupun endpoint atau Supabase REST API dipanggil langsung.

Validasi input dibuat manual tanpa library tambahan seperti Zod agar dependency tetap dekat dengan requirement. Validasi dilakukan di client untuk UX dan di server untuk keamanan.

## Trade-offs

- Section catatan kasbon dibuat menggunakan data table agar lebih rapi untuk banyak data, dengan konsekuensi layout mobile perlu dibuat khusus agar tetap nyaman di layar kecil.
- Validasi manual cukup untuk field yang sederhana, tetapi pada aplikasi yang lebih besar schema validator seperti Zod bisa membantu menjaga konsistensi.
- Chart dibuat sederhana agar fokus tetap pada fungsi utama dashboard.
- Grouping nama orang yang sama belum dijadikan tampilan utama karena fitur inti CRUD, RLS, search, sort, dan state handling diprioritaskan lebih dulu.

## Time Spent

- Setup project, Supabase, dan auth: sekitar 2 jam
- Database schema, RLS, dan API route: sekitar 3 jam
- Dashboard CRUD, filter, search, sort, chart, dan mobile polish: sekitar 3 jam
- Testing RLS dan README: sekitar 2 jam

Total: sekitar 10 jam

## Demo

Vercel URL:

```text
https://kasbon-app-nu.vercel.app/
```

## Notes

Token Supabase Auth dan service role key tidak boleh dipublikasikan. Untuk dokumentasi testing, token di terminal atau screenshot sebaiknya di-crop atau disamarkan.
