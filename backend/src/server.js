import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';

const app = express();

// CORS
const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin, credentials: true }));

// Parsers
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

// Routes
app.use('/api', authRoutes);

// Contoh route protected
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'Protected OK', address: req.user.address });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[server] listening on http://0.0.0.0:${port}`);
  console.log(`[server] CORS origin: ${origin}`);
});
