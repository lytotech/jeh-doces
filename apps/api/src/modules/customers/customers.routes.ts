import { Router } from 'express';
import { db } from '../../db';

export const customersRouter = Router();

customersRouter.get('/customers', async (req, res) => res.json(await db.getCustomers(req.query.archived === 'true', String(req.query.search || ''))));
customersRouter.post('/customers', async (req, res) => res.status(201).json(await db.saveCustomer(req.body)));
customersRouter.put('/customers/:id', async (req, res) => res.json(await db.saveCustomer({ ...req.body, id: req.params.id })));
customersRouter.patch('/customers/:id/archive', async (req, res) => {
  const updated = await db.archiveCustomer(req.params.id, req.body.archived !== false);
  if (!updated) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(updated);
});

customersRouter.get('/commitments', async (_req, res) => res.json(await db.getCommitments()));
customersRouter.post('/commitments', async (req, res) => res.status(201).json(await db.saveCommitment(req.body)));
customersRouter.put('/commitments/:id', async (req, res) => res.json(await db.saveCommitment({ ...req.body, id: req.params.id })));
customersRouter.delete('/commitments/:id', async (req, res) => res.json({ success: await db.deleteCommitment(req.params.id) }));
