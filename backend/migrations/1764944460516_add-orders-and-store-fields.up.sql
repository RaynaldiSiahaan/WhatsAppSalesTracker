BEGIN;

ALTER TABLE stores 
ADD COLUMN slug VARCHAR(100),
ADD COLUMN store_code CHAR(5);

ALTER TABLE stores 
ADD CONSTRAINT stores_slug_unique UNIQUE (slug),
ADD CONSTRAINT stores_store_code_unique UNIQUE (store_code);

-- Assuming table is empty or we accept failure if data exists without defaults
ALTER TABLE stores ALTER COLUMN slug SET NOT NULL;
ALTER TABLE stores ALTER COLUMN store_code SET NOT NULL;

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(30) UNIQUE NOT NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    pickup_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'RECEIVED' NOT NULL,
    total_amount_gross NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_order_code ON orders(order_code);
CREATE INDEX idx_orders_store_id ON orders(store_id);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    price_at_order NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

COMMIT;
