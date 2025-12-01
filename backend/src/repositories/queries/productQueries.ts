export const productQueries = {
  insert: `
    INSERT INTO products (name, price, sku)
    VALUES ($1, $2, $3)
    RETURNING id, name, price, sku, created_at;
  `,
  list: `
    SELECT id, name, price, sku, created_at
    FROM products
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `,
  findById: `
    SELECT id, name, price, sku, created_at
    FROM products
    WHERE id = $1;
  `
};
