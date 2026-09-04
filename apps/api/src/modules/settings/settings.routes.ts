import { Router } from 'express';
import { db } from '../../db';
import { requireRole } from '../../auth';

export const settingsRouter = Router();

settingsRouter.get('/settings', async (_req, res) => res.json(await db.getSettings()));
settingsRouter.put('/settings', requireRole('owner', 'admin'), async (req, res) => res.json(await db.saveSettings(req.body)));
settingsRouter.get('/backup', requireRole('owner', 'admin'), async (_req, res) => res.json(await db.getAllData()));
settingsRouter.post('/backup/restore', requireRole('owner'), async (req, res) => res.json({ success: await db.restoreAllData(req.body) }));
settingsRouter.post('/backup/reset', requireRole('owner'), async (_req, res) => { await db.resetToDefault(); res.json({ success: true }); });
