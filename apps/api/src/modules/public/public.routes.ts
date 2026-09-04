import { Router } from 'express';
import { db } from '../../infrastructure/database';

export const publicRouter = Router();

publicRouter.get('/orders/:token', async (req, res) => {
  const order = await db.getPublicOrder(req.params.token);
  if (!order) return res.status(404).json({ error: 'Link inválido ou expirado' });
  res.json(order);
});
