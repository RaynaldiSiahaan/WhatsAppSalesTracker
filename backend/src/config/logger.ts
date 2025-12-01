import { appendFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { env } from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const activeLevel = (env.logLevel as LogLevel) in levels ? (env.logLevel as LogLevel) : 'info';
const logDirectory = resolve(__dirname, '..', '..', 'logs');
const errorLogFile = resolve(logDirectory, 'error.log');
let logDirReady = false;

const shouldLog = (level: LogLevel) => levels[level] >= levels[activeLevel];

const ensureLogDirectory = async () => {
  if (logDirReady) {
    return;
  }

  await mkdir(logDirectory, { recursive: true });
  logDirReady = true;
};

const stringifyArg = (value: unknown): string => {
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }

  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Unserializable Object]';
    }
  }

  return String(value);
};

const writeErrorLog = async (args: unknown[]) => {
  const line = `${new Date().toISOString()} [error] ${args.map(stringifyArg).join(' | ')}`;

  try {
    await ensureLogDirectory();
    await appendFile(errorLogFile, `${line}\n`);
  } catch (error) {
    console.error('[logger] Failed to write error log file', error);
  }
};

export const logger = {
  debug: (...args: unknown[]) => shouldLog('debug') && console.debug('[debug]', ...args),
  info: (...args: unknown[]) => shouldLog('info') && console.info('[info]', ...args),
  warn: (...args: unknown[]) => shouldLog('warn') && console.warn('[warn]', ...args),
  error: (...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error('[error]', ...args);
    }

    void writeErrorLog(args);
  }
};

const formatContextMessage = (context: string, message: string) => `[${context}] ${message}`;

export const logError = (context: string, message: string, error?: unknown, metadata?: Record<string, unknown>) => {
  const args: unknown[] = [formatContextMessage(context, message)];

  if (error) {
    args.push(error);
  }

  if (metadata) {
    args.push(metadata);
  }

  logger.error(...args);
};
