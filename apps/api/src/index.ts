import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { db, runForCompany } from './db';
import { authRouter, requireAuth, requireRole } from './auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Helper to get local network IP
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const k of Object.keys(interfaces)) {
    for (const k2 of interfaces[k] || []) {
      if (k2.family === 'IPv4' && !k2.internal) {
        addresses.push(k2.address);
      }
    }
  }
  return addresses;
}

// === Health Check ===
app.get('/api/health', async (req, res) => {
  await db.ping();
  res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.get('/api/public/orders/:token', async (req, res) => {
  const order = await db.getPublicOrder(req.params.token);
  if (!order) return res.status(404).json({ error: 'Link inválido ou expirado' });
  res.json(order);
});
app.use('/api', requireAuth, (req, _res, next) => runForCompany(req.auth!.companyId, next));

// === Ingredients ===
app.get('/api/ingredients', async (req, res) => {
  res.json(await db.getIngredients());
});

app.post('/api/ingredients', async (req, res) => {
  const saved = await db.saveIngredient(req.body);
  res.status(201).json(saved);
});

app.put('/api/ingredients/:id', async (req, res) => {
  const saved = await db.saveIngredient({ ...req.body, id: req.params.id });
  res.json(saved);
});

app.delete('/api/ingredients/:id', async (req, res) => {
  const success = await db.deleteIngredient(req.params.id);
  res.json({ success });
});

app.post('/api/ingredients/:id/history', async (req, res) => {
  const updated = await db.addPriceHistory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ingredient not found' });
  res.json(updated);
});

// === Materials ===
app.get('/api/materials', async (req, res) => {
  res.json(await db.getMaterials());
});

app.post('/api/materials', async (req, res) => {
  const saved = await db.saveMaterial(req.body);
  res.status(201).json(saved);
});

app.put('/api/materials/:id', async (req, res) => {
  const saved = await db.saveMaterial({ ...req.body, id: req.params.id });
  res.json(saved);
});

app.delete('/api/materials/:id', async (req, res) => {
  const success = await db.deleteMaterial(req.params.id);
  res.json({ success });
});

app.patch('/api/materials/:id/stock', async (req, res) => {
  const { stockQuantity } = req.body;
  const updated = await db.adjustMaterialStock(req.params.id, Number(stockQuantity));
  if (!updated) return res.status(404).json({ error: 'Material not found' });
  res.json(updated);
});

// === Products ===
app.get('/api/products', async (req, res) => {
  res.json(await db.getProducts());
});

app.post('/api/products', async (req, res) => {
  const saved = await db.saveProduct(req.body);
  res.status(201).json(saved);
});

app.put('/api/products/:id', async (req, res) => {
  const saved = await db.saveProduct({ ...req.body, id: req.params.id });
  res.json(saved);
});

app.delete('/api/products/:id', async (req, res) => {
  const success = await db.deleteProduct(req.params.id);
  res.json({ success });
});

// === Orders ===
app.get('/api/orders', async (req, res) => {
  res.json(await db.getOrders());
});

app.post('/api/orders', async (req, res) => {
  const saved = await db.saveOrder(req.body);
  res.status(201).json(saved);
});

app.put('/api/orders/:id', async (req, res) => {
  const saved = await db.saveOrder({ ...req.body, id: req.params.id });
  res.json(saved);
});

app.delete('/api/orders/:id', async (req, res) => {
  const success = await db.deleteOrder(req.params.id);
  res.json({ success });
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const updated = await db.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

app.post('/api/orders/:id/share-link', async (req, res) => {
  const token = await db.createOrderShareLink(req.params.id);
  if (!token) return res.status(404).json({ error: 'Order not found' });
  res.json({ token });
});

// === Customers ===
app.get('/api/customers', async (req, res) => {
  res.json(await db.getCustomers(req.query.archived === 'true', String(req.query.search || '')));
});

app.post('/api/customers', async (req, res) => {
  res.status(201).json(await db.saveCustomer(req.body));
});

app.put('/api/customers/:id', async (req, res) => {
  res.json(await db.saveCustomer({ ...req.body, id: req.params.id }));
});

app.patch('/api/customers/:id/archive', async (req, res) => {
  const updated = await db.archiveCustomer(req.params.id, req.body.archived !== false);
  if (!updated) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(updated);
});

app.post('/api/orders/:id/payments', async (req, res) => {
  const updated = await db.addPayment(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

app.delete('/api/orders/:id/payments/:paymentId', async (req, res) => {
  const updated = await db.removePayment(req.params.id, req.params.paymentId);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

// === Settings ===
app.get('/api/settings', async (req, res) => {
  res.json(await db.getSettings());
});

app.put('/api/settings', requireRole('owner', 'admin'), async (req, res) => {
  const updated = await db.saveSettings(req.body);
  res.json(updated);
});

// === Backup & Full Data ===
app.get('/api/backup', requireRole('owner', 'admin'), async (req, res) => {
  res.json(await db.getAllData());
});

app.post('/api/backup/restore', requireRole('owner'), async (req, res) => {
  const success = await db.restoreAllData(req.body);
  res.json({ success });
});

app.post('/api/backup/reset', requireRole('owner'), async (req, res) => {
  await db.resetToDefault();
  res.json({ success: true });
});

// === Serve Static Frontend in Production ===
const distPath = path.resolve(__dirname, '../../web/dist');
app.use(express.static(distPath));

app.use(async (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Frontend build not found. Run npm run build first.');
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  const message = error instanceof Error ? error.message : 'Erro interno.';
  res.status(message.includes('inválido') || message.includes('Informe') ? 400 : 500).json({ error: message });
});

app.listen(Number(PORT), HOST, () => {
  const ips = getLocalIpAddress();
  console.log(`\n🧁 ===============================================`);
  console.log(`✨ JEH DOCES • BACK-END & API SERVIDOR RODANDO`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🏠 Local:   http://localhost:${PORT}`);
  ips.forEach((ip) => {
    console.log(`📱 Rede (Outros dispositivos): http://${ip}:${PORT}`);
  });
  console.log(`===============================================\n`);
});
