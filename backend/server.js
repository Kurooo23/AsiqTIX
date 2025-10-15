// server.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'

import authRoutes from './src/routes/auth.js'
import mintRoutes from './src/routes/mint.js'
import eventsRouter from './src/routes/events.js'

import { requireAuth } from './src/middleware/requireAuth.js'

const app = express()

app.use(helmet())
const limiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false })
app.use(limiter)

const origin = process.env.CORS_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin, credentials: true }))

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev' })
})

// routes
app.use('/api', authRoutes)
app.use('/api/mint', mintRoutes)
app.use('/api', eventsRouter)

app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'Protected OK', address: req.user.address })
})

// error handler
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err)
  const status = err.status || 500
  res.status(status).json({ message: err.message || 'Internal Server Error' })
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`[server] listening on http://0.0.0.0:${port}`)
  console.log(`[server] CORS origin: ${origin}`)
})
