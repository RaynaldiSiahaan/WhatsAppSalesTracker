import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';

/**
 * Decrypts a hex-encoded string using AES-256-CBC.
 * The key and IV are taken from environment variables `AES_KEY` and `AES_IV`.
 *
 * @param encryptedText The encrypted text (hex-encoded string) to decrypt.
 * @returns The decrypted text (utf8-encoded string).
 * @throws Error if encryption keys are missing or decryption fails.
 */
export const decrypt = (encryptedText: string): string => {
  if (!env.db.aesKey || !env.db.aesTv) {
    throw new Error('Encryption keys (AES_KEY, AES_IV) are missing in environment variables. Please provide them in .env file.');
  }

  try {
    // Keys and IV are expected to be provided as hex strings in the environment variables.
    // AES-256-CBC requires a 32-byte key (64 hex characters) and a 16-byte IV (32 hex characters).
    const key = Buffer.from(env.db.aesKey, 'hex');
    const iv = Buffer.from(env.db.aesTv, 'hex');

    if (key.length !== 32) {
      throw new Error(`Invalid AES_KEY length. Expected 32 bytes (64 hex chars), got ${key.length} bytes.`);
    }
    if (iv.length !== 16) {
      throw new Error(`Invalid AES_IV length. Expected 16 bytes (32 hex chars), got ${iv.length} bytes.`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt data: ${(error as Error).message}. Please check AES_KEY, AES_IV, and ENCRYPTED_DB_PASSWORD in your .env file.`);
  }
};
