import { Router } from 'express';
import { db } from '../../infrastructure/database';

export const catalogRouter = Router();

catalogRouter.get('/ingredients', async (_req, res) => res.json(await db.getIngredients()));
catalogRouter.post('/ingredients', async (req, res) => res.status(201).json(await db.saveIngredient(req.body)));
catalogRouter.put('/ingredients/:id', async (req, res) => res.json(await db.saveIngredient({ ...req.body, id: req.params.id })));
catalogRouter.delete('/ingredients/:id', async (req, res) => res.json({ success: await db.deleteIngredient(req.params.id) }));
catalogRouter.post('/ingredients/:id/history', async (req, res) => {
  const updated = await db.addPriceHistory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ingredient not found' });
  res.json(updated);
});

catalogRouter.get('/materials', async (_req, res) => res.json(await db.getMaterials()));
catalogRouter.post('/materials', async (req, res) => res.status(201).json(await db.saveMaterial(req.body)));
catalogRouter.put('/materials/:id', async (req, res) => res.json(await db.saveMaterial({ ...req.body, id: req.params.id })));
catalogRouter.delete('/materials/:id', async (req, res) => res.json({ success: await db.deleteMaterial(req.params.id) }));
catalogRouter.patch('/materials/:id/stock', async (req, res) => {
  const updated = await db.adjustMaterialStock(req.params.id, Number(req.body.stockQuantity));
  if (!updated) return res.status(404).json({ error: 'Material not found' });
  res.json(updated);
});

catalogRouter.get('/products', async (_req, res) => res.json(await db.getProducts()));
catalogRouter.post('/products', async (req, res) => res.status(201).json(await db.saveProduct(req.body)));
catalogRouter.put('/products/:id', async (req, res) => res.json(await db.saveProduct({ ...req.body, id: req.params.id })));
catalogRouter.delete('/products/:id', async (req, res) => res.json({ success: await db.deleteProduct(req.params.id) }));
