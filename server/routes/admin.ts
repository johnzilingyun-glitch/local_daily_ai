import express from 'express';
import { saveAnalysis, getHistory, getLogs, addLogEntry } from '../services/fileStore';
import { APIError } from '../middleware/errorHandler';

const router = express.Router();

router.get('/history/context', async (req, res, next) => {
  try {
    const history = await getHistory();
    res.json(history);
  } catch (err: any) {
    next(new APIError(err.message || 'Failed to read history', 500));
  }
});

router.get('/logs/optimization', async (req, res, next) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (err: any) {
    next(new APIError(err.message || 'Failed to read logs', 500));
  }
});

router.post('/history/save', async (req, res, next) => {
  const { type, data } = req.body;
  if (!type || !data) return next(new APIError('Type and data are required', 400));
  try {
    const id = await saveAnalysis(type, data);
    res.json({ success: true, id });
  } catch (err: any) {
    next(new APIError(err.message || 'Failed to save analysis to history', 500));
  }
});

router.post('/logs/add', async (req, res, next) => {
  const { field, oldValue, newValue, description } = req.body;
  if (!field || !description) return next(new APIError('Field and description are required', 400));
  try {
    await addLogEntry(field, oldValue, newValue, description);
    res.json({ success: true });
  } catch (err: any) {
    next(new APIError(err.message || 'Failed to add log entry', 500));
  }
});

router.get('/history/env-check', (req, res) => {
  res.json({
    keys: Object.keys(process.env),
    feishuWebhookDefined: !!process.env.FEISHU_WEBHOOK_URL,
    appUrl: process.env.APP_URL,
    nodeEnv: process.env.NODE_ENV
  });
});

router.post('/telemetry/report', async (req, res, next) => {
  try {
    const event = req.body;
    const { recordResilienceEvent } = await import('../middleware/telemetry');
    await recordResilienceEvent(event);
    res.json({ success: true });
  } catch (err: any) {
    next(new APIError(err.message || 'Failed to report telemetry', 500));
  }
});

export default router;
