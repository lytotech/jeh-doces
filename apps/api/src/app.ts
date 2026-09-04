import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runForCompany } from './infrastructure/database';
import { authRouter, requireAuth } from './auth';
import { env } from './config/env';
import { healthRouter } from './modules/health/health.routes';
import { publicRouter } from './modules/public/public.routes';
import { catalogRouter } from './modules/catalog/catalog.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { customersRouter } from './modules/customers/customers.routes';
import { settingsRouter } from './modules/settings/settings.routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api', requireAuth, (req, _res, next) => runForCompany(req.auth!.companyId, next));
app.use('/api', catalogRouter);
app.use('/api', ordersRouter);
app.use('/api', customersRouter);
app.use('/api', settingsRouter);

const distPath = path.resolve(__dirname, '../../web/dist');
app.use(express.static(distPath));
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  res.status(404).send('Frontend build not found. Run npm run build first.');
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  const message = error instanceof Error ? error.message : 'Erro interno.';
  res.status(message.includes('inválido') || message.includes('Informe') ? 400 : 500).json({ error: message });
});

export { app };
