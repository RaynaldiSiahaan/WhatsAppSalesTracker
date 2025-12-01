import { Router } from 'express';
import { createMessagePreviewHandler } from '../handlers/messageHandler';

const router = Router();

router.post('/messages/preview', createMessagePreviewHandler);

export default router;
