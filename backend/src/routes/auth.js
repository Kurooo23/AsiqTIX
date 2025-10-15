// backend/src/routes/auth.js
import express from 'express'
import { SiweMessage } from 'siwe'
import { randomBytes } from 'crypto'
import { setNonce, getNonce, deleteNonce } from '../lib/nonce-store/index.js'
import { signToken } from '../lib/jwt.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

const ADMIN_WALLETS = (process.env.ADMIN_WALLETS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

const norm = s => String(s || '').trim().toLowerCase()
const rolesFor = address => ADMIN_WALLETS.includes(norm(address)) ? ['admin'] : ['customer']

function isEthAddress(addr) {
  // alamat 0x + 40 hex (lower/upper akan dinormalkan)
  return /^0x[a-f0-9]{40}$/.test(norm(addr))
}

// =============== GET /api/nonce =================
router.get('/nonce', async (req, res) => {
  try {
    const q = req.query || {}
    const raw = q.address || q.addr || ''
    const addr = norm(raw)

    if (!isEthAddress(addr)) {
      return res.status(400).json({ message: 'Parameter address tidak valid' })
    }

    const nonce = randomBytes(16).toString('hex')
    await setNonce(addr, nonce)
    return res.json({ nonce })
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Gagal membuat nonce' })
  }
})

// =============== POST /api/verify ===============
router.post('/verify', async (req, res) => {
  try {
    const { message, signature } = req.body || {}
    if (!message || !signature) {
      return res.status(400).json({ message: 'message & signature required' })
    }

    // Verifikasi SIWE
    const siweMessage = new SiweMessage(message)
    const { data } = await siweMessage.verify({ signature })
    const addr = norm(data.address)

    if (!isEthAddress(addr)) {
      return res.status(400).json({ message: 'Alamat wallet tidak valid' })
    }

    // Cocokkan nonce
    const expected = await getNonce(addr)
    if (!expected || expected !== data.nonce) {
      return res.status(400).json({ message: 'Invalid or expired nonce' })
    }
    await deleteNonce(addr)

    const userRoles = rolesFor(addr)
    const token = signToken(
      { sub: addr, address: addr, roles: userRoles, chainId: data.chainId },
      '1d'
    )

    return res.json({
      message: 'ok',
      address: data.address,
      roles: userRoles,
      chainId: data.chainId,
      token
    })
  } catch (e) {
    // SIWE gagal verifikasi biasanya 400 (bukan 500)
    return res.status(400).json({ message: e?.message || 'Verify failed' })
  }
})

// =============== GET /api/me ====================
router.get('/me', requireAuth, (req, res) => {
  const { address, roles, sub, chainId } = req.user || {}
  return res.json({ address: address || sub, roles: roles || [], chainId: chainId ?? null })
})

export default router
