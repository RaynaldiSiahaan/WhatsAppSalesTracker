import { Router } from 'express';
import healthRouter from './health';
import sampleRouter from './sample';

const router = Router();

router.use(healthRouter);
router.use(sampleRouter);

export default router;
