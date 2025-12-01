import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import routes from './routes';
import { env } from './config/env';
import { responseTemplates } from './constants/responses';
import { logError, logger } from './config/logger';
import { requestLogger } from './middleware/requestLogger';
import { sendResponse } from './utils/http';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/', (_req, res) =>
  sendResponse(
    res,
    responseTemplates.ok('Backend starter kit is running', {
      service: env.appName,
      docs: '/api/health'
    })
  )
);

app.use(routes);

app.use((req, res) =>
  sendResponse(res, {
    ...responseTemplates.notFound('Route not found'),
    data: { pathTried: req.path }
  })
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logError('app.errorHandler', 'Unhandled application error', err);
  sendResponse(res, responseTemplates.serverError());
});

export default app;
