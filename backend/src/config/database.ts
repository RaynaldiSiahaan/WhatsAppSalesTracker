import { Pool, PoolClient, PoolConfig } from 'pg';
import { env } from './env';
import { logError, logger } from './logger';

type DatabaseProvider = 'planetscale' | 'postgres' | 'mysql' | 'mongodb' | 'local' | 'supabase';

export interface DatabaseCredentials {
  name: string;
  user: string;
  password: string;
}

export interface DatabaseConfig {
  url: string;
  provider: DatabaseProvider;
  maxConnections: number;
  ssl: boolean;
  credentials: DatabaseCredentials;
}

const defaultProvider: DatabaseProvider = (process.env.DB_PROVIDER as DatabaseProvider) ?? 'local';
const defaultHost = process.env.DB_HOST ?? 'localhost';
const defaultPort = Number(process.env.DB_PORT ?? '5432');

const credentials: DatabaseCredentials = {
  name: process.env.DB_NAME ?? '',
  user: process.env.DB_USER ?? '',
  password: process.env.DB_PASSWORD ?? ''
};

export const databaseConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL ?? '',
  provider: defaultProvider,
  maxConnections: Number(process.env.DB_MAX_CONNECTIONS ?? '5'),
  ssl: env.isProduction,
  credentials
};

export const isDatabaseConfigured = () =>
  Boolean(databaseConfig.url) ||
  Boolean(
    databaseConfig.credentials.name &&
      databaseConfig.credentials.user &&
      databaseConfig.credentials.password
  );

const buildPoolConfig = (config: DatabaseConfig): PoolConfig => {
  const ssl =
    config.ssl && config.provider !== 'local'
      ? {
          rejectUnauthorized: false
        }
      : undefined;

  if (config.url) {
    return {
      connectionString: config.url,
      max: config.maxConnections,
      ssl
    };
  }

  return {
    host: defaultHost,
    port: defaultPort,
    database: config.credentials.name,
    user: config.credentials.user,
    password: config.credentials.password,
    max: config.maxConnections,
    ssl
  };
};

class DatabasePool {
  private connected = false;
  private activeClients = 0;
  private readonly shouldConnect: boolean;
  private readonly usesCredentials: boolean;
  private readonly usesConnectionString: boolean;
  private pool: Pool | null = null;

  constructor(private readonly config: DatabaseConfig) {
    this.usesCredentials = Boolean(
      config.credentials.name && config.credentials.user && config.credentials.password
    );
    this.usesConnectionString = Boolean(config.url);
    this.shouldConnect = this.usesCredentials || this.usesConnectionString;
  }

  async connect() {
    if (this.connected) {
      return;
    }

    if (!this.shouldConnect) {
      throw new Error('Database configuration missing. Provide DATABASE_URL or DB_NAME/DB_USER/DB_PASSWORD.');
    }

    try {
      const poolConfig = buildPoolConfig(this.config);
      this.pool = new Pool(poolConfig);

      if (this.usesConnectionString) {
        logger.info(`Connecting to ${this.config.provider} database via connection string...`);
      } else {
        this.ensureCredentials();
        logger.info(`Connecting to ${this.config.provider} database...`);
        logger.debug(`Using DB ${this.config.credentials.name} with user ${this.config.credentials.user}`);
      }

      await this.pool.query('SELECT 1');
      this.connected = true;
      logger.info('Database connection established.');
    } catch (error) {
      this.connected = false;
      const err = error instanceof Error ? error : new Error(String(error));
      logError('database.connect', 'Failed to connect to database', err);

      await this.pool?.end().catch((cleanupError) => logError('database.connect', 'Failed closing pool after connect error', cleanupError));
      this.pool = null;
      throw err;
    }
  }

  private ensureCredentials() {
    if (!this.usesCredentials) {
      throw new Error('Database credentials (DB_NAME, DB_USER, DB_PASSWORD) are required when no DATABASE_URL is provided.');
    }
  }

  async disconnect() {
    if (!this.connected) {
      return;
    }

    logger.info('Closing database connections...');
    try {
      await this.pool?.end();
    } catch (error) {
      logError('database.disconnect', 'Error closing database pool', error as Error);
    }
    this.pool = null;
    this.connected = false;
    this.activeClients = 0;
  }

  async run<T>(operation: (client: PoolClient | null) => Promise<T> | T): Promise<T> {
    await this.ensurePool();

    if (!this.pool) {
      return operation(null);
    }

    const client = await this.pool.connect();
    this.activeClients += 1;
    try {
      return await operation(client);
    } finally {
      this.activeClients = Math.max(0, this.activeClients - 1);
      client.release();
    }
  }

  private async ensurePool() {
    if (!this.connected) {
      await this.connect();
    }
  }

  status() {
    return {
      connected: this.connected,
      activeClients: this.activeClients
    };
  }
}

let pool: DatabasePool | null = null;

export const getDatabasePool = () => pool;

export const initDatabasePool = async () => {
  if (!pool) {
    pool = new DatabasePool(databaseConfig);
  }

  await pool.connect();
  return pool;
};

export const runWithDatabase = async <T>(operation: (client: PoolClient | null) => Promise<T> | T) => {
  const activePool = await initDatabasePool();

  if (!activePool) {
    return operation(null);
  }

  return activePool.run(operation);
};

export const closeDatabasePool = async () => {
  if (!pool) {
    return;
  }

  await pool.disconnect();
  pool = null;
};
