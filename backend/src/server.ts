import app from './app';
import { env } from './config/env';
import { closeDatabasePool, initDatabasePool } from './config/database';
import { logError, logger } from './config/logger';

const port = env.port;
type ShutdownSignal = NodeJS.Signals | 'uncaughtException' | 'unhandledRejection';

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

const start = async () => {
  try {
    await initDatabasePool();
    logger.info('Database pool initialized.');
  } catch (error) {
    logError('server.start', 'Failed to initialize database pool', error as Error);
    throw error;
  }

  server = app
    .listen(port, () => {
      logger.info(`⚡️ ${env.appName} running on http://localhost:${port}`);
    })
    .on('error', (err) => logError('server.http', 'Server error', err));
};

const closeServer = () =>
  new Promise<void>((resolve) => {
    if (!server) {
      return resolve();
    }

    server.close(() => resolve());
  });

const shutdown = async (signal: ShutdownSignal, error?: Error) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  if (error) {
    logError('server.shutdown', 'Reason for shutdown', error);
  }

  try {
    await closeServer();
    await closeDatabasePool();
    logger.info('Graceful shutdown complete.');
    process.exit(error ? 1 : 0);
  } catch (shutdownError) {
    logError('server.shutdown', 'Error during shutdown', shutdownError as Error);
    process.exit(1);
  }
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal as NodeJS.Signals, () => {
    void shutdown(signal as NodeJS.Signals);
  });
});

process.on('uncaughtException', (error) => {
  void shutdown('uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  void shutdown('unhandledRejection', error);
});

void start().catch((error) => {
  logError('server.bootstrap', 'Failed to start server', error);
  void shutdown('uncaughtException', error);
});
