import { Router } from 'express';
import { db } from '../../infrastructure/database';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  await db.ping();
  res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
});
