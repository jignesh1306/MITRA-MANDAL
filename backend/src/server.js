import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

// Auto Keep-Alive service to prevent Render 15-minute inactivity spin-down
const startKeepAlive = () => {
  const rawUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || process.env.SERVER_URL;
  if (!rawUrl) {
    console.log('[KEEP-ALIVE] Note: RENDER_EXTERNAL_URL or BACKEND_URL not set. Set it in Render dashboard to enable self-ping.');
    return;
  }

  const cleanUrl = rawUrl.replace(/\/+$/, '');
  const targetUrl = cleanUrl.endsWith('/api') ? `${cleanUrl}/health` : `${cleanUrl}/api/health`;
  const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (Render sleeps after 15 minutes of inactivity)

  const pingServer = async () => {
    try {
      if (typeof fetch === 'function') {
        const res = await fetch(targetUrl);
        if (res.ok) {
          console.log(`[KEEP-ALIVE] Pinged ${targetUrl} (Status: ${res.status}) at ${new Date().toLocaleTimeString()}`);
        } else {
          console.warn(`[KEEP-ALIVE] Ping status: ${res.status}`);
        }
      }
    } catch (err) {
      console.warn('[KEEP-ALIVE] Ping notice:', err.message);
    }
  };

  // Ping shortly after startup (1 minute), then every 10 minutes
  setTimeout(pingServer, 60 * 1000);
  setInterval(pingServer, INTERVAL_MS);
  console.log(`[KEEP-ALIVE] Active: pinging ${targetUrl} every 10 minutes`);
};

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Mitra-Mandal Server running on port ${port}`);
    startKeepAlive();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[PORT ERROR] Port ${port} is occupied by an old background process. Retrying in 1 second...`);
      setTimeout(() => startServer(port), 1000);
    } else {
      console.error('[SERVER ERROR]', err);
    }
  });
};

connectDB().then(() => {
  startServer(DEFAULT_PORT);
});

