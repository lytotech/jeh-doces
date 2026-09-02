import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { db } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// === Ingredients ===
app.get('/api/ingredients', (req, res) => {
  res.json(db.getIngredients());
});

app.post('/api/ingredients', (req, res) => {
  const saved = db.saveIngredient(req.body);
  res.status(201).json(saved);
});

app.put('/api/ingredients/:id', (req, res) => {
  const saved = db.saveIngredient({ ...req.body, id: req.params.id });
  res.json(saved);
});

app.delete('/api/ingredients/:id', (req, res) => {
  const success = db.deleteIngredient(req.params.id);
  res.json({ success });
});

app.post('/api/ingredients/:id/history', (req, res) => {
  const updated = db.addPriceHistory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Ingredient not found' });
  res.json(updated);
});

// === Materials ===
app.get('/api/materials', (req, res) => {
  res.json(db.getMaterials());
});

app.post('/api/materials', (req, res) => {
  const saved = db.saveMaterial(req.body);
  res.status(201).json(saved);
});

app.put('/api/materials/:id', (req, res) => {
  const saved = db.saveMaterial({ ...req.body, id: req.params.id });
  res.json(saved);
});

app.delete('/api/materials/:id', (req, res) => {
  const success = db.deleteMaterial(req.params.id);
  res.json({ success });
});

app.patch('/api/materials/:id/stock', (req, res) => {
  const { stockQuantity } = req.body;
  const updated = db.adjustMaterialStock(req.params.id, Number(stockQuantity));
  if (!updated) return res.status(404).json({ error: 'Material not found' });
  res.json(updated);
});

// === Products ===
app.get('/api/products', (req, res) => {
  res.json(db.getProducts());
});

app.post('/api/products', (req, res) => {
  const saved = db.saveProduct(req.body);
  res.status(201).json(saved);
});

app.put('/api/products/:id', (req, res) => {
  const saved = db.saveProduct({ ...req.body, id: req.params.id });
  res.json(saved);
});

app.delete('/api/products/:id', (req, res) => {
  const success = db.deleteProduct(req.params.id);
  res.json({ success });
});

// === Orders ===
app.get('/api/orders', (req, res) => {
  res.json(db.getOrders());
});

app.post('/api/orders', (req, res) => {
  const saved = db.saveOrder(req.body);
  res.status(201).json(saved);
});

app.put('/api/orders/:id', (req, res) => {
  const saved = db.saveOrder({ ...req.body, id: req.params.id });
  res.json(saved);
});

app.delete('/api/orders/:id', (req, res) => {
  const success = db.deleteOrder(req.params.id);
  res.json({ success });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const updated = db.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

app.post('/api/orders/:id/payments', (req, res) => {
  const updated = db.addPayment(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

app.delete('/api/orders/:id/payments/:paymentId', (req, res) => {
  const updated = db.removePayment(req.params.id, req.params.paymentId);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

// === Settings ===
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', (req, res) => {
  const updated = db.saveSettings(req.body);
  res.json(updated);
});

// === Backup & Full Data ===
app.get('/api/backup', (req, res) => {
  res.json(db.getAllData());
});

app.post('/api/backup/restore', (req, res) => {
  const success = db.restoreAllData(req.body);
  res.json({ success });
});

app.post('/api/backup/reset', (req, res) => {
  db.resetToDefault();
  res.json({ success: true });
});

// === Serve Static Frontend in Production ===
const distPath = path.resolve(__dirname, '../../web/dist');
app.use(express.static(distPath));

app.use((req, res) => {
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

app.listen(PORT, () => {
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
