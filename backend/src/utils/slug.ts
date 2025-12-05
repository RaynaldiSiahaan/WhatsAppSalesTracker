import { randomBytes } from 'crypto';

/**
 * Generates a URL-friendly slug from a given string.
 * Appends a random suffix if requested (not implemented here, but logic can be extended).
 * @param text The text to slugify
 */
export const generateSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start
    .replace(/-+$/, '');      // Trim - from end
};

/**
 * Generates a unique store code (CHAR(5)).
 * Format: 5 alphanumeric characters (uppercase).
 */
export const generateStoreCode = (): string => {
  // Generate 3 random bytes (24 bits) -> enough for 5 chars?
  // Let's just use a simple random string generator restricted to 5 chars.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = randomBytes(5);
  
  for (let i = 0; i < 5; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
};

/**
 * Generates a readable Order Code.
 * Format: {storeCode}-{YYMMDD}-{Sequence/Random}
 * Note: Strict sequence is hard without a dedicated counter table.
 * We will use {storeCode}-{YYMMDD}-{Random4Chars} for simplicity in Phase 2,
 * or just {storeCode}-{Random6Chars}.
 * 
 * The spec says: [store_code] + [timestamp] + [seq]
 * Let's try to approximate [seq] with random for now to avoid locking,
 * or use timestamp ms.
 * 
 * Implementation: {StoreCode}-{YYMMDD}-{Random4}
 */
export const generateOrderCode = (storeCode: string): string => {
  const date = new Date();
  const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, ''); // 250101
  const randomSuffix = randomBytes(2).toString('hex').toUpperCase(); // 4 chars
  return `${storeCode}-${yymmdd}-${randomSuffix}`;
};
