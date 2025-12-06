-- Mock Data / Seeder untuk Backend Toko (PostgreSQL 14 - BigInt)

BEGIN;

-- 1. Insert Users
-- Password hash untuk 'password123' (sebagai contoh, gunakan bcrypt hash yang valid di produksi)
-- Misal: $2a$10$X7... (hash valid yang dihasilkan dari 'password123')
INSERT INTO users (email, password_hash, is_active) VALUES
('seller1@example.com', '$2a$10$X7...validhashexample...', true),
('seller2@example.com', '$2a$10$X7...validhashexample...', true);

-- 2. Insert Stores
-- user_id 1 -> seller1
-- user_id 2 -> seller2
INSERT INTO stores (user_id, name, slug, store_code, location, created_by) VALUES
(1, 'Toko Maju Jaya', 'toko-maju-jaya', 'TMJ01', 'Jakarta Selatan', 1),
(2, 'Warung Berkah', 'warung-berkah', 'WBK99', 'Bandung', 2);

-- 3. Insert Products
-- Produk untuk Toko Maju Jaya (store_id 1)
INSERT INTO products (store_id, name, price, stock_quantity, image_url, is_active, created_by) VALUES
(1, 'Beras Premium 5kg', 65000, 50, 'https://example.com/beras.jpg', true, 1),
(1, 'Minyak Goreng 2L', 32000, 100, 'https://example.com/minyak.jpg', true, 1),
(1, 'Gula Pasir 1kg', 14000, 75, 'https://example.com/gula.jpg', true, 1);

-- Produk untuk Warung Berkah (store_id 2)
INSERT INTO products (store_id, name, price, stock_quantity, image_url, is_active, created_by) VALUES
(2, 'Indomie Goreng', 3500, 200, 'https://example.com/indomie.jpg', true, 2),
(2, 'Telur Ayam 1kg', 28000, 30, 'https://example.com/telur.jpg', true, 2);

-- 4. Insert Orders (Optional, for testing reporting/history)
-- Order di Toko Maju Jaya
INSERT INTO orders (order_code, store_id, customer_name, customer_phone, pickup_time, status, total_amount_gross) VALUES
('TMJ01-20231025-001', 1, 'Budi Santoso', '081234567890', NOW() + INTERVAL '1 day', 'COMPLETED', 97000);

-- 5. Insert Order Items
-- Item untuk order di atas (Beras 1x, Minyak 1x)
INSERT INTO order_items (order_id, product_id, name, price_at_order, quantity) VALUES
(1, 1, 'Beras Premium 5kg', 65000, 1),
(1, 2, 'Minyak Goreng 2L', 32000, 1);

COMMIT;
