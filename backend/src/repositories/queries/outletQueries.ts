export const outletQueries = {
  insert: `
    INSERT INTO outlets (name, address, phone_number)
    VALUES ($1, $2, $3)
    RETURNING id, name, address, phone_number, created_at;
  `,
  list: `
    SELECT id, name, address, phone_number, created_at
    FROM outlets
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `,
  findById: `
    SELECT id, name, address, phone_number, created_at
    FROM outlets
    WHERE id = $1;
  `
};
