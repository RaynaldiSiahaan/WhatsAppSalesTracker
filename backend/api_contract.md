🚀 TOKO BACKEND - Seller Management API (Phase 1 & 2 Foundation)

Dokumen ini berfungsi sebagai Spesifikasi Teknis Master dan Panduan Penggunaan untuk backend aplikasi manajemen toko.

Backend ini dirancang menggunakan Arsitektur Berlapis (Controller -> Service -> Repository) untuk menjamin testability dan keamanan data.

## 1. Stack Teknologi & Standar

| Komponen | Implementasi | Keterangan |
| :--- | :--- | :--- |
| **Bahasa** | TypeScript (Express.js) | Digunakan untuk kode backend. |
| **Database** | PostgreSQL 14 | Database eksternal (host di luar Docker Compose). |
| **Migration** | node-pg-migrate | Menggunakan Raw SQL untuk manajemen skema. |
| **Auth** | JWT (Access Token 24h + Refresh Token) | Digunakan dengan bcryptjs dan dekripsi AES-256 untuk secrets. |
| **Testing** | Jest | Untuk Unit dan Integration Testing. |
| **Aturan Harga** | Gross Price | Harga produk (`price`) sudah termasuk pajak (Tax Included). |

## 2. Setup dan Menjalankan Aplikasi

### A. Prasyarat Wajib
*   Docker & Docker Compose
*   Node.js v20+
*   Go (untuk menjalankan alat enkripsi password)
*   PostgreSQL 14 (Harus berjalan dan dapat diakses secara eksternal)

### B. Langkah Setup
1.  Install Dependencies: `npm install`
2.  Konfigurasi Environment: Buat file `.env` dari `.env.example`.
3.  Enkripsi Password DB:
    *   Jalankan `go run encrypt_pass_tool.go` untuk menghasilkan nilai `ENCRYPTED_DB_PASSWORD`, `AES_KEY`, dan `AES_IV` yang acak dan unik.
    *   Salin hasilnya ke file `.env` Anda.
4.  Jalankan Migrasi Database (Wajib):
    *   Pastikan `DB_HOST` di `.env` mengarah ke IP database PostgreSQL eksternal Anda.
    *   Jalankan: `npm run migrate:up` (atau gunakan Docker Compose).
5.  Jalankan Server: `npm run dev` (untuk hot-reload) atau `docker-compose up --build` (untuk lingkungan container).

## 3. Skema Database PostgreSQL (Final Design)

Skema ini mencakup kedua fase (Inventaris dan Pemesanan). Audit fields (`created_by`, `updated_at`, dll.) ada pada semua tabel utama.

### A. Tabel `users` (Otentikasi & Soft Delete)
| Field | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | UUID (PK) | User ID (digunakan di JWT). |
| `email` | VARCHAR | Unique. |
| `is_active` | BOOLEAN | Status akun (Soft Delete). |

### B. Tabel `stores` (Manajemen Toko & Akses Publik)
| Field | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `user_id` | UUID (FK users.id) | Pemilik Toko. Relasi: ON DELETE RESTRICT. |
| `slug` | VARCHAR(100) | URL-friendly name (Unique). Digunakan untuk Share Link. |
| `store_code` | CHAR(5) | Kode toko unik (Digunakan dalam order_code). |

### C. Tabel `products` (Inventaris & Katalog)
| Field | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `store_id` | UUID (FK stores.id) | Relasi: ON DELETE CASCADE. |
| `price` | NUMERIC | Harga Gross (Include Tax). |
| `stock_quantity` | INTEGER | Stok saat ini. Constraint: CHECK >= 0. |
| `image_url` | VARCHAR | Tautan gambar produk. |

### D. Tabel `orders` (Fase 2 - Header Transaksi)
| Field | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `order_code` | VARCHAR | Order ID yang mudah dibaca. |
| `store_id` | UUID (FK stores.id) | Toko yang menerima pesanan. |
| `customer_name` | VARCHAR | Nama pelanggan. |
| `customer_phone` | VARCHAR | Nomor telepon pelanggan. |
| `pickup_time` | TIMESTAMPTZ | Waktu pengambilan pesanan. |
| `total_amount_gross` | NUMERIC | Total pesanan (termasuk pajak). |
| `status` | VARCHAR | Status: RECEIVED, PREPARING, READY_FOR_PICKUP, COMPLETED, CANCELLED. |

## 4. Kontrak API Lengkap

Semua respons menggunakan Bahasa Inggris.
Format standar respons:
```json
{
  "status_code": 200,
  "success": true,
  "message": "...",
  "data": { ... },
  "error": "..." // Hanya muncul jika success: false
}
```

### 4.1. Authentication

#### Register
*   **Endpoint:** `POST /api/auth/register`
*   **Deskripsi:** Mendaftarkan pengguna baru.

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d 
'{ 
  "email": "seller@example.com",
  "password": "securepassword123"
}'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid-user-id",
    "email": "seller@example.com",
    "is_active": true
  }
}
```

#### Login
*   **Endpoint:** `POST /api/auth/login`
*   **Deskripsi:** Masuk dan mendapatkan token akses.

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d 
'{ 
  "email": "seller@example.com",
  "password": "securepassword123"
}'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-user-id",
      "email": "seller@example.com"
    },
    "accessToken": "jwt-access-token...",
    "refreshToken": "refresh-token-string..."
  }
}
```

#### Refresh Token
*   **Endpoint:** `POST /api/auth/refresh`
*   **Deskripsi:** Memperbarui Access Token menggunakan Refresh Token.

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
-H "Content-Type: application/json" \
-d 
'{ 
  "refreshToken": "refresh-token-string..."
}'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-access-token...",
    "refreshToken": "new-refresh-token-string..."
  }
}
```

### 4.2. User Management

#### Change Password
*   **Endpoint:** `PATCH /api/user/profile`
*   **Deskripsi:** Mengganti password pengguna (Membutuhkan Auth).

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/user/profile \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d 
'{ 
  "newPassword": "newsecurepassword456"
}'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Password updated successfully"
}
```

#### Delete Account
*   **Endpoint:** `DELETE /api/user/account`
*   **Deskripsi:** Melakukan soft delete pada akun pengguna (Membutuhkan Auth).

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/user/account \
-H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Account deactivated successfully"
}
```

### 4.3. Store Management

#### Create Store
*   **Endpoint:** `POST /api/stores`
*   **Deskripsi:** Membuat toko baru. Slug dan Store Code dibuat otomatis.

**cURL:**
```bash
curl -X POST http://localhost:3000/api/stores \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d 
'{ 
  "name": "Warung Budi",
  "location": "Pasar Modern BSD"
}'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Store created successfully",
  "data": {
    "id": "uuid-store-id",
    "name": "Warung Budi",
    "slug": "warung-budi",
    "store_code": "A1B2C",
    "location": "Pasar Modern BSD"
  }
}
```

#### Get My Stores
*   **Endpoint:** `GET /api/stores/my`
*   **Deskripsi:** Mendapatkan daftar toko milik pengguna yang sedang login.

**cURL:**
```bash
curl -X GET http://localhost:3000/api/stores/my \
-H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "My stores retrieved successfully",
  "data": [
    {
      "id": "uuid-store-id",
      "name": "Warung Budi",
      "slug": "warung-budi",
      "store_code": "A1B2C"
    }
  ]
}
```

### 4.4. Product Management

#### Add Product
*   **Endpoint:** `POST /api/stores/:storeId/products`
*   **Deskripsi:** Menambahkan produk ke toko.

**cURL:**
```bash
curl -X POST http://localhost:3000/api/stores/<STORE_ID>/products \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d 
'{ 
  "name": "Nasi Goreng Spesial",
  "price": 25000,
  "stock_quantity": 100,
  "image_url": "https://example.com/nasigoreng.jpg"
}'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Product added successfully",
  "data": {
    "id": "uuid-product-id",
    "name": "Nasi Goreng Spesial",
    "price": "25000",
    "stock_quantity": 100
  }
}
```

#### Update Stock
*   **Endpoint:** `PATCH /api/products/:productId/stock`
*   **Deskripsi:** Memperbarui jumlah stok produk.

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/products/<PRODUCT_ID>/stock \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d 
'{ 
  "newQuantity": 50
}'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Product stock updated successfully",
  "data": {
    "id": "uuid-product-id",
    "stock_quantity": 50
  }
}
```

#### Delete Product
*   **Endpoint:** `DELETE /api/products/:productId`
*   **Deskripsi:** Melakukan soft delete pada produk.

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/products/<PRODUCT_ID> \
-H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Product soft-deleted successfully."
}
```

### 4.5. Public Access (Buyer)

#### Get Catalog
*   **Endpoint:** `GET /api/public/catalog/:slug`
*   **Deskripsi:** Mendapatkan informasi toko dan daftar produk yang tersedia (stok > 0 dan aktif).

**cURL:**
```bash
curl -X GET http://localhost:3000/api/public/catalog/warung-budi
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Catalog retrieved successfully",
  "data": {
    "store": {
      "id": "uuid-store-id",
      "name": "Warung Budi",
      "slug": "warung-budi",
      "location": "Pasar Modern BSD"
    },
    "products": [
      {
        "id": "uuid-product-id",
        "name": "Nasi Goreng Spesial",
        "price": "25000",
        "stock_quantity": 50,
        "image_url": "https://example.com/nasigoreng.jpg"
      }
    ]
  }
}
```

#### Create Order
*   **Endpoint:** `POST /api/public/orders`
*   **Deskripsi:** Membuat pesanan baru dari pembeli. Mengurangi stok secara otomatis.

**cURL:**
```bash
curl -X POST http://localhost:3000/api/public/orders \
-H "Content-Type: application/json" \
-d 
'{ 
  "store_id": "<STORE_ID>",
  "customer_name": "Andi",
  "customer_phone": "08123456789",
  "pickup_time": "2023-12-25T10:00:00Z",
  "items": [
    {
      "product_id": "<PRODUCT_ID>",
      "quantity": 2
    }
  ]
}'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "uuid-order-id",
    "order_code": "A1B2C-250101-X9Y8",
    "status": "RECEIVED",
    "total_amount_gross": "50000",
    "items": [
      {
        "product_id": "uuid-product-id",
        "quantity": 2,
        "price_at_order": 25000
      }
    ]
  }
}
```