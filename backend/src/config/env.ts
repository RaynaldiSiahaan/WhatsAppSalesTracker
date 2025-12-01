import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const projectRoot = resolve(__dirname, '..', '..');

const loadEnvFile = () => {
  const envFile = `.env.${nodeEnv}`;
  const candidates = [envFile, '.env'];

  for (const candidate of candidates) {
    const candidatePath = resolve(projectRoot, candidate);
    if (existsSync(candidatePath)) {
      config({ path: candidatePath });
      return candidatePath;
    }
  }

  return undefined;
};

if (!process.env.SKIP_ENV_FILE) {
  loadEnvFile();
}

const isProduction = nodeEnv === 'production';

export const env = {
  port: Number(process.env.PORT ?? '4000'),
  appName: process.env.APP_NAME ?? 'WhatsApp Sales Tracker API',
  isProduction,
  logLevel: process.env.LOG_LEVEL ?? 'info'
};
