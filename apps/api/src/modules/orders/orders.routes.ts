import { Router } from 'express';
import { db } from '../../infrastructure/database';

export const ordersRouter = Router();

ordersRouter.get('/orders', async (_req, res) => res.json(await db.getOrders()));
ordersRouter.post('/orders', async (req, res) => res.status(201).json(await db.saveOrder(req.body)));
ordersRouter.put('/orders/:id', async (req, res) => res.json(await db.saveOrder({ ...req.body, id: req.params.id })));
ordersRouter.delete('/orders/:id', async (req, res) => res.json({ success: await db.deleteOrder(req.params.id) }));
ordersRouter.patch('/orders/:id/status', async (req, res) => {
  const updated = await db.updateOrderStatus(req.params.id, req.body.status);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});
ordersRouter.post('/orders/:id/share-link', async (req, res) => {
  const token = await db.createOrderShareLink(req.params.id);
  if (!token) return res.status(404).json({ error: 'Order not found' });
  res.json({ token });
});
ordersRouter.post('/orders/:id/payments', async (req, res) => {
  const updated = await db.addPayment(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});
ordersRouter.delete('/orders/:id/payments/:paymentId', async (req, res) => {
  const updated = await db.removePayment(req.params.id, req.params.paymentId);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});
