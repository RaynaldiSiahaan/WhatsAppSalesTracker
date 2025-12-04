# Backend Toko (Seller) - Fase 1

Dokumen ini berisi dokumentasi teknis dan panduan penggunaan untuk backend aplikasi manajemen toko (fokus: Seller), sesuai dengan Master Technical Specification. Backend ini dirancang untuk aplikasi manajemen toko dan mengimplementasikan fitur autentikasi, manajemen toko, dan manajemen produk.

## 1. Stack Teknologi & Standar

*   **Bahasa:** TypeScript (Strict Mode)
*   **Runtime:** Node.js (v20+)
*   **Framework:** Express.js
*   **Database:** PostgreSQL 14 (Driver: `pg`)
*   **Migration:** `node-pg-migrate` (Raw SQL)
*   **Auth:** JWT (Access Token 24h + Refresh Token) menggunakan `jsonwebtoken` dan `bcryptjs` untuk hashing password.
*   **Logging:** Winston (Structured Log) untuk pencatatan log yang terstruktur.
*   **Environment:** Docker & Docker Compose
*   **Validation:** Manual checks untuk validasi input yang robust.
*   **Testing:** Jest dan Supertest untuk unit dan integration testing.

## 2. Struktur Folder Proyek

Proyek ini mengikuti Arsitektur Berlapis (Layered Architecture) secara ketat:

```
backend/
├── src/
│   ├── config/        # Konfigurasi DB (Pool), env vars, dekripsi AES
│   ├── controllers/   # Handler Request/Response (Hanya memanggil Service)
│   ├── middleware/    # Auth (JWT Verify) & Global Error Handler
│   ├── repositories/  # Akses Database Raw SQL (Query terjadi di sini)
│   ├── services/      # Logika Bisnis (Validasi, Auth logic, Transaction)
│   ├── utils/         # Logger, Custom Errors, Crypto helper, Response Interface, Validation
│   ├── entities/      # Definisi interface untuk objek database (User, Store, Product)
│   ├── app.ts         # Definisi aplikasi Express (tanpa start listener)
│   ├── routes.ts      # Definisi Route API
│   └── server.ts      # Entry point & Graceful Shutdown (start listener)
├── migrations/        # File SQL Migrasi
├── tests/             # Unit test & Integration test
├── .env.example       # Template variabel lingkungan
├── Dockerfile
├── docker-compose.yml
├── jest.config.js     # Konfigurasi Jest
└── package.json
```

## 3. Skema Database (PostgreSQL 14)

Semua tabel menggunakan UUID v4. Harga adalah Gross (termasuk pajak).

*   **users**: `id`, `email`, `password_hash`, `is_active` (Soft Delete), `deleted_at`, `created_at`, `updated_at`.
*   **refresh_tokens**: `token`, `user_id`, `expires_at`, `created_at`.
*   **stores**: `id`, `user_id`, `name`, `location`, `created_by`, `created_at`, `updated_by`, `updated_at`.
*   **products**: `id`, `store_id`, `name`, `price`, `stock_quantity`, `image_url`, `is_active` (Soft Delete), `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at`.

## 4. Cara Menjalankan Aplikasi (Local Development)

### Prasyarat
*   Node.js v20+
*   PostgreSQL 14 (Local atau Docker)
*   Pastikan PostgreSQL Anda berjalan dan dapat diakses dengan kredensial yang benar.

### Langkah-langkah

1.  **Install Dependencies**
    ```bash
    cd backend
    npm install
    ```

2.  **Konfigurasi Environment**
    Salin file `.env.example` ke `.env` dan sesuaikan konfigurasinya.
    ```bash
    cp .env.example .env
    ```
    *   Pastikan `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` sesuai dengan database lokal Anda.
    *   `DB_PASSWORD` adalah password plaintext untuk migrator dan development.
    *   `AES_KEY` (32 bytes hex) dan `AES_IV` (16 bytes hex) diperlukan untuk dekripsi `ENCRYPTED_DB_PASSWORD`.
    *   `JWT_SECRET` adalah secret key untuk JSON Web Token.

3.  **Jalankan Migrasi Database**
    Pastikan database target sudah dibuat (misal: `toko_db`).
    ```bash
    npm run migrate:up
    ```
    Jika ada masalah koneksi, periksa kembali kredensial database di file `.env` Anda.

4.  **Jalankan Server (Development Mode)**
    ```bash
    npm run dev
    ```
    Server akan berjalan di `http://localhost:3000` (atau port yang didefinisikan di `.env`).

## 5. Cara Menjalankan dengan Docker

Gunakan Docker Compose untuk menjalankan aplikasi beserta migrasinya dalam container.

1.  Pastikan Docker Desktop berjalan.
2.  Sesuaikan environment variables di `docker-compose.yml` atau buat file `.env` yang sesuai.
3.  Jalankan perintah:
    ```bash
    docker-compose up --build
    ```
    Ini akan:
    *   Membangun image backend.
    *   Menjalankan container `migrator` untuk melakukan migrasi database.
    *   Menjalankan container `api` setelah migrasi selesai.
    *   **Catatan:** Docker Compose yang disediakan saat ini tidak termasuk layanan database PostgreSQL. Anda harus memastikan PostgreSQL berjalan secara eksternal atau menambahkan layanan database ke `docker-compose.yml` jika ingin menjalankannya dalam Docker.

## 6. Endpoint API Utama

Semua endpoint utama dilindungi oleh JWT Middleware (kecuali Auth).

*   **Auth:**
    *   `POST /api/auth/register` - Daftar user baru.
    *   `POST /api/auth/login` - Login (Return Access Token + Refresh Token).
    *   `POST /api/auth/refresh` - Tukar Refresh Token dengan Access Token baru.

*   **User:**
    *   `DELETE /api/user/account` - Soft delete akun sendiri (membutuhkan JWT).
    *   `PATCH /api/user/profile` - Ganti password/email (membutuhkan JWT).

*   **Stores:**
    *   `POST /api/stores` - Buat toko baru (membutuhkan JWT).
    *   `GET /api/stores/my` - List toko milik user (membutuhkan JWT).

*   **Products:**
    *   `POST /api/stores/:storeId/products` - Tambah produk ke toko (membutuhkan JWT).
    *   `PATCH /api/products/:productId/stock` - Update stok produk (membutuhkan JWT).
    *   `DELETE /api/products/:productId` - Soft delete produk (membutuhkan JWT).

## 7. Skrip Tersedia

*   `npm run dev`: Menjalankan server dengan hot-reload (`ts-node-dev`).
*   `npm run build`: Melakukan build TypeScript ke JavaScript (folder `dist`).
*   `npm start`: Menjalankan hasil build (`node dist/server.js`).
*   `npm run migrate:up`: Menjalankan migrasi database ke versi terbaru.
*   `npm run migrate:down`: Membatalkan migrasi terakhir.
*   `npm run migrate:create <nama_migrasi>`: Membuat file migrasi baru.
*   `npm run type-check`: Memeriksa tipe TypeScript tanpa melakukan build.
*   `npm test`: Menjalankan unit dan integration tests menggunakan Jest.
