import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: resolve(__dirname, '../../', envFile) });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    name: process.env.DB_NAME || 'toko_db',
    password: process.env.DB_PASSWORD, // Optional (for local/migrator)
    encryptedPassword: process.env.ENCRYPTED_DB_PASSWORD,
    aesKey: process.env.AES_KEY,
    aesTv: process.env.AES_IV,
  },
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  logLevel: process.env.LOG_LEVEL || 'info',
};