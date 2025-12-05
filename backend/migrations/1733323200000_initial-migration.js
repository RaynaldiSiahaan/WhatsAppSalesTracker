/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.sql(`
    -- Ekstensi untuk UUID
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- A. Tabel Users
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- B. Tabel Refresh Tokens
    CREATE TABLE refresh_tokens (
        token VARCHAR(255) PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- C. Tabel Stores
    CREATE TABLE stores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
        name VARCHAR(255) NOT NULL,
        location TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- D. Tabel Products
    CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
        stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        image_url VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        deleted_at TIMESTAMPTZ
    );

    -- Indexes
    CREATE INDEX idx_products_store_id ON products(store_id);
    CREATE INDEX idx_stores_user_id ON stores(user_id);
    CREATE INDEX idx_products_is_active ON products(is_active);
  `);
};

exports.down = pgm => {
  pgm.sql(`
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS stores;
    DROP TABLE IF EXISTS refresh_tokens;
    DROP TABLE IF EXISTS users;
    DROP EXTENSION IF EXISTS "uuid-ossp";
  `);
};
