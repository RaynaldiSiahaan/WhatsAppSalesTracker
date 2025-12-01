import { Router } from 'express';
import { env } from '../config/env';
import { responseTemplates } from '../constants/responses';
import { sendResponse } from '../utils/http';

const router = Router();

router.get('/health', (_req, res) => {
  const data = {
    status: 'ok',
    service: env.appName,
    timestamp: new Date().toISOString()
  };

  sendResponse(res, responseTemplates.ok('Service healthy', data));
});

export default router;
