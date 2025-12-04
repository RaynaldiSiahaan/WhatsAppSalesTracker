import { Pool } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger'; // Import the new logger
import { decrypt } from '../utils/crypto'; // Import the crypto utility

const getDbPassword = (): string => {
  // If a plain password is provided, use it (e.g., for local development or migrator)
  if (env.db.password) {
    return env.db.password;
  }

  // If an encrypted password is provided, decrypt it
  if (env.db.encryptedPassword) {
    try {
      return decrypt(env.db.encryptedPassword);
    } catch (err) {
      logger.error('Failed to decrypt database password', err);
      throw new Error('Database password decryption failed: ' + (err as Error).message);
    }
  }

  // If neither is provided, throw an error
  throw new Error('No database password provided (DB_PASSWORD or ENCRYPTED_DB_PASSWORD env variable missing)');
};

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  database: env.db.name,
  password: getDbPassword(),
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  // Consider a more robust error handling strategy for production,
  // potentially attempting to reconnect or notify administrators.
  process.exit(-1);
});

export default pool;
