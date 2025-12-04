import app from './app';
import { env } from './config/env';
import pool from './config/database';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // Verify Database Connection
    await pool.query('SELECT 1');
    logger.info('Database connection established.');

    const server = app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        pool.end(() => {
          logger.info('Database pool closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
