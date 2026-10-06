import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import geocodeHandler from './api/geocode.ts';
import carparksHandler from './api/carparks.ts';
import evHandler from './api/ev.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // API Routes
  app.get('/api/geocode', async (req, res) => {
    try {
      await geocodeHandler(req, res);
    } catch (err: any) {
      console.error('Error in /api/geocode:', err);
      res.status(500).json({ error: err.message || 'Geocode error' });
    }
  });

  app.get('/api/carparks', async (req, res) => {
    try {
      await carparksHandler(req, res);
    } catch (err: any) {
      console.error('Error in /api/carparks:', err);
      res.status(500).json({ error: err.message || 'Carparks error' });
    }
  });

  app.get('/api/ev', async (req, res) => {
    try {
      await evHandler(req, res);
    } catch (err: any) {
      console.error('Error in /api/ev:', err);
      res.status(500).json({ error: err.message || 'EV error' });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ParkSmart SG' });
  });

  // Vite middleware in dev or static files in prod
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ParkSmart SG server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
