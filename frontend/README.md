# Toko Frontend

Ini adalah frontend untuk aplikasi **Toko**, dibangun menggunakan React, Vite, TypeScript, dan Tailwind CSS.

## 🚀 Memulai (Getting Started)

### Prasyarat
Pastikan Anda telah menginstal:
- Node.js (v18 atau v20 disarankan)
- NPM

### Instalasi Dependensi
Masuk ke direktori frontend dan instal paket yang dibutuhkan:

```bash
cd frontend
npm install
```

### Menjalankan Server Development
Untuk menjalankan aplikasi dalam mode development (dengan Hot Module Replacement):

```bash
npm run dev
```
Aplikasi akan dapat diakses di `http://localhost:5173`.

Pastikan backend juga berjalan agar fitur API berfungsi dengan baik. Konfigurasi URL backend dapat diatur di file `.env` (atau gunakan default `http://localhost:3000`).

## 🧪 Menjalankan Test
Proyek ini menggunakan **Vitest** untuk unit testing.

### Menjalankan Semua Test
```bash
npm test
```

### Menjalankan Test dengan Coverage
```bash
npm run test -- --coverage
```

## 📦 Build untuk Produksi
Untuk membuat build produksi (output di folder `dist/`):

```bash
npm run build
```

## 🐳 Docker
Aplikasi ini sudah dikonfigurasi untuk dijalankan menggunakan Docker (Nginx).

```bash
# Build dan jalankan container
docker build -t toko-frontend .
docker run -p 80:80 toko-frontend
```

Atau gunakan `docker-compose` dari root project:
```bash
docker-compose up --build
```

## 📂 Struktur Proyek

- `src/components`: Komponen UI yang dapat digunakan kembali.
- `src/pages`: Halaman utama aplikasi (berdasarkan route).
- `src/services`: Logika pemanggilan API (Axios).
- `src/store`: State management global (Zustand).
- `src/types`: Definisi tipe TypeScript.
- `src/test`: Konfigurasi dan helper untuk testing.