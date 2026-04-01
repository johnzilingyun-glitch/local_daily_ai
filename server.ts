import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { ensureDirs, addLogEntry } from './server/services/fileStore';

// Routes
import marketRoutes from './server/routes/market';
import stockRoutes from './server/routes/stock';
import feishuRoutes from './server/routes/feishu';
import adminRoutes from './server/routes/admin';
import { errorHandler } from './server/middleware/errorHandler';
import { telemetryMiddleware } from './server/middleware/telemetry';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize data store
  await ensureDirs();

  app.use(express.json({ limit: '10mb' }));
  app.use(telemetryMiddleware);
  
  // Logging Middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // API Routes
  app.use('/api/stock', marketRoutes); // Indices and Commodities
  app.use('/api/stock', stockRoutes);  // Realtime and Search
  app.use('/api/feishu', feishuRoutes);
  app.use('/api', adminRoutes);        // History and Logs

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  // Error Handler (must be last)
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await addLogEntry('server', 'startup', 'active', 'Server started with modular architecture');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
