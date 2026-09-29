# Ruang Proyek – Digital Product Commerce

Platform lapak produk digital mandiri (template AutoCAD, SketchUp, Master RAB Excel, design system, dll.) dengan katalog publik, checkout, pengiriman produk otomatis, dan admin dashboard.

> **STATUS: PROTOTIPE / TAHAP BUILD. BELUM SIAP LIVE.**
> Dibangun dengan Google AI Studio. Masih memakai data dummy dan sebagian besar integrasi masih **SIMULASI**. Jangan dipakai untuk transaksi atau data pelanggan asli sebelum bagian keamanan dan integrasi dikerjakan (lihat `CATATAN_PROGRAMMER.md`).

---

## Isi Dokumen

1. [Fitur](#fitur)
2. [Teknologi](#teknologi)
3. [Cara Menjalankan](#cara-menjalankan)
4. [Struktur Folder](#struktur-folder)
5. [Aturan Bisnis Inti](#aturan-bisnis-inti)
6. [Mode Test vs Live](#mode-test-vs-live)
7. [Test End-to-End](#test-end-to-end)
8. [Status Integrasi](#status-integrasi)
9. [Catatan Keamanan](#catatan-keamanan)
10. [Alur Kerja Pengembangan](#alur-kerja-pengembangan)
11. [Rencana Berikutnya](#rencana-berikutnya)

---

## Fitur

**Halaman publik (pembeli)**
- Katalog produk dengan kategori dan pencarian
- Checkout (nama, email, WhatsApp, metode bayar, kode promo)
- Order bump dan 1-click upsell
- Cek order
- Halaman download dengan token aman

**Admin dashboard**
- Dashboard: pendapatan, order per status, konversi, grafik tren harian
- Order, Produk, Pelanggan, Abandoned
- Promo/kupon
- WhatsApp follow-up otomatis (Auto)
- Pixel dan tracking (Meta, TikTok, Google, GTM)
- Analitik
- Gateway pembayaran (Midtrans, Xendit, Tripay, Duitku)
- Simulator (khusus Mode Test)
- Notifikasi dan Audit Log
- Lisensi produk dan manajemen kuota download
- Pengaturan

---

## Teknologi

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express (`server.ts`)
- **Package manager:** Bun (`bun.lock`)
- **Penyimpanan data (sementara):** file JSON (`data_store.json`)

---

## Cara Menjalankan

**Prasyarat:** Node.js (disarankan LTS terbaru) dan [Bun](https://bun.sh).

```bash
# 1. Clone repo
git clone https://github.com/aanpangestu09/RP-V.3-GG-STUDIO.git
cd RP-V.3-GG-STUDIO

# 2. Pasang dependensi
bun install

# 3. Siapkan environment
cp .env.example .env
# lalu isi nilai di .env (jangan commit file .env)

# 4. Jalankan mode development
bun run dev
```

Aplikasi berjalan di `http://localhost:3000` (atau sesuai `PORT`).

> Perintah di atas mengikuti konvensi umum. Cek bagian `scripts` di `package.json` untuk nama perintah yang sebenarnya, dan perbarui bagian ini kalau berbeda.

**Variabel environment** (lihat `.env.example`):

| Variabel | Fungsi |
|---|---|
| `GEMINI_API_KEY` | Kunci Gemini API (diisi otomatis oleh AI Studio saat berjalan di sana) |
| `APP_URL` | URL tempat aplikasi di-host, dipakai untuk link download dan callback |
| `PORT` | Port server (default 3000) |
| `NODE_ENV` | `production` untuk mode produksi |

Jangan pernah menaruh key asli (gateway, WhatsApp, dll.) di repo. Simpan di `.env`.

---

## Struktur Folder

```
.
├── public/assets/        Gambar dan aset statis (logo, sampul produk)
├── server/               Logika backend
│   ├── db/store.ts       Penyimpanan data (data_store.json)
│   └── services/         paymentService, deliveryService, notificationService,
│                         orderStateMachine, e2eTestRunner
├── src/                  Frontend (React)
│   ├── lib/dashboardMetrics.ts   Perhitungan semua angka dashboard
│   └── types/schema.ts           Definisi tipe data (Order, Product, dll.)
├── server.ts             Entry point backend + semua endpoint API
├── index.html
├── vite.config.ts
├── data_store.json       Data dummy (jangan berisi data pelanggan asli)
├── .env.example          Contoh variabel environment
└── ATURAN.md, PROGRESS.md, CATATAN_PROGRAMMER.md   (dokumen kerja, lihat di bawah)
```

---

## Aturan Bisnis Inti

Bagian ini adalah sumber kebenaran. Jangan diubah tanpa persetujuan pemilik produk.

**Status order**

| Dari | Ke | Keterangan |
|---|---|---|
| (order baru) | `MENUNGGU` | Status awal |
| `MENUNGGU` | `LUNAS` | Pembayaran diterima |
| `MENUNGGU` | `GAGAL` | Pembayaran ditolak |
| `MENUNGGU` | `KADALUARSA` | Lewat batas waktu bayar (default 24 jam) |

- `LUNAS`, `GAGAL`, `KADALUARSA` adalah status akhir dan tidak boleh kembali ke `MENUNGGU`. Percobaan yang tidak valid ditolak dan dicatat di Audit Log.
- Event pembayaran yang sama yang masuk dua kali diproses sekali saja (idempotent).

**Aksi saat status berubah**
- `LUNAS`: produk ditandai terkirim, konfirmasi WhatsApp dicatat, data pelanggan diperbarui.
- `GAGAL` / `KADALUARSA`: masuk daftar Abandoned.
- Setiap perubahan dicatat di Audit Log (waktu, order, status lama, status baru, sumber).

**Definisi angka dashboard** (semua dari satu sumber data, `src/lib/dashboardMetrics.ts`)
- **Pendapatan (Lunas)** = total nominal order berstatus `LUNAS`
- **Semua Order** = jumlah semua status
- **Konversi** = order `LUNAS` / Semua Order
- **AOV** = Pendapatan / jumlah order `LUNAS`
- **Abandoned** = `GAGAL` + `KADALUARSA`
- **Invarian:** Menunggu + Lunas + Gagal + Kadaluarsa harus selalu sama dengan Semua Order

---

## Mode Test vs Live

Setiap order punya penanda sumber `test` atau `live`. Dashboard hanya menghitung data sesuai mode aktif. Menu **Simulator** hanya muncul di Mode Test. Semua data dummy bertanda `test`.

---

## Test End-to-End

Dijalankan lewat tombol **Jalankan Test End-to-End** di halaman Simulator (endpoint `/api/e2e/run`). Menampilkan tabel LULUS/GAGAL untuk skenario: buat order, bayar berhasil, bayar gagal, kedaluwarsa, event ganda, status tidak valid, invarian total, konsistensi angka, dan pemisahan Test/Live.

**Aturan:** setelah setiap perubahan logika, jalankan test ini dan pastikan semuanya LULUS. Jangan mengaku "sudah benar" tanpa hasil test.

---

## Status Integrasi

| Komponen | Status |
|---|---|
| Alur order dan status (state machine) | Berjalan (data lokal) |
| Perhitungan dashboard | Berjalan |
| Pembayaran (Midtrans/Xendit/Tripay/Duitku) | **SIMULASI**, belum terhubung ke akun gateway asli |
| Webhook pembayaran | **SIMULASI**, verifikasi belum aman untuk produksi |
| WhatsApp otomatis | **SIMULASI**, hanya tercatat di log |
| Pengiriman email | **SIMULASI** |
| Database | **Sementara:** file JSON, belum database sungguhan |
| Login admin | **Belum aman:** belum ada sesi/token |
| Pixel/tracking | Perlu diverifikasi dengan ID asli |
| Deploy/hosting | Belum |

---

## Catatan Keamanan

Repo ini adalah prototipe. Ada celah yang sudah diketahui dan **wajib ditutup sebelum live**, antara lain: endpoint admin belum terlindungi autentikasi, verifikasi webhook belum aman, dan secret cadangan masih tertulis di kode. Daftar lengkapnya ada di `CATATAN_PROGRAMMER.md`.

Sampai itu selesai:
- Gunakan repo **private**.
- Gunakan **data dummy** saja.
- Jangan isi key gateway/WhatsApp asli.
- Jangan commit `.env`, `data_store.json` yang berisi data asli, atau file produk digital berbayar ke repo.

---

## Alur Kerja Pengembangan

Proyek dibangun bergantian di beberapa sesi AI Studio, jadi AI tidak punya ingatan antar sesi. Aturannya:

1. **Awal sesi baru:** minta AI membaca `README.md`, `ATURAN.md`, dan `PROGRESS.md` dulu.
2. **Ubah hanya yang diminta.** Jangan biarkan AI menulis ulang atau "merapikan" kode di luar permintaan.
3. **Jalankan test end-to-end** setelah setiap perubahan besar.
4. **Commit kecil dan sering** dengan pesan jelas, misalnya `dashboard: sinkron angka, test lulus`.
5. **Pakai branch** untuk fitur baru (`fitur-checkout`), gabungkan ke `main` hanya kalau test lulus.
6. **Beri tag versi** tiap milestone (`v0.1`, `v0.2`, dst.).
7. **Perbarui `PROGRESS.md`** di akhir sesi: apa yang selesai, apa yang sedang dikerjakan, apa berikutnya.
8. **Kerjakan satu halaman/fitur per sesi** supaya pindah akun tidak memutus pekerjaan di tengah.

---

## Rencana Berikutnya

**Sisi produk (sedang dikerjakan pemilik produk)**
- [ ] Rapikan tampilan depan (semi company profile)
- [ ] Halaman Produk dan Checkout
- [ ] Konten asli: deskripsi produk, FAQ, kebijakan refund, syarat lisensi
- [ ] Halaman legal: Kebijakan Privasi, Syarat & Ketentuan, Refund
- [ ] Uji sebagai pembeli dari awal sampai download

**Sisi teknis (diserahkan ke programmer setelah tahap build selesai)**
- [ ] Autentikasi admin dan pengamanan endpoint
- [ ] Integrasi gateway pembayaran dan webhook yang aman
- [ ] Database sungguhan
- [ ] Pengiriman WhatsApp dan email asli
- [ ] Deploy ke hosting
- [ ] Pertahankan test end-to-end sebagai test otomatis

---

## Kontak

Pemilik produk: Aan Pangestu
