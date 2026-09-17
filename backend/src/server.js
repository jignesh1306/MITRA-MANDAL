import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Mitra-Mandal Server running on port ${port}`);
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

