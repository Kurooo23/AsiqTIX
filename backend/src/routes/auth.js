import express from 'express';
import { SiweMessage } from 'siwe';
import { randomBytes } from 'crypto';
import { setNonce, getNonce, deleteNonce } from '../lib/nonce-store/index.js';
import { signToken } from '../lib/jwt.js';

const router = express.Router();

/**
 * GET /api/nonce?address=0x...
 */
router.get('/nonce', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ message: 'address required' });

    const nonce = randomBytes(16).toString('hex');
    await setNonce(address, nonce);

    return res.json({ nonce });
  } catch (e) {
    return res.status(500).json({ message: 'failed to create nonce' });
  }
});

/**
 * POST /api/verify
 * body: { message, signature }
 */
router.post('/verify', async (req, res) => {
  try {
    const { message, signature } = req.body || {};
    if (!message || !signature) {
      return res.status(400).json({ message: 'message & signature required' });
    }

    const siweMessage = new SiweMessage(message);
    const { data } = await siweMessage.verify({ signature });

    // Cocokkan nonce one-time
    const expected = await getNonce(data.address);
    if (!expected || expected !== data.nonce) {
      return res.status(400).json({ message: 'Invalid or expired nonce' });
    }

    // Nonce tidak boleh dipakai ulang
    await deleteNonce(data.address);

    // Buat token sesi (JWT)
    const token = signToken({ address: data.address.toLowerCase() }, '1d');

    // (opsional) set HttpOnly cookie jika mau cookie-based session
    // res.cookie('auth', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 86400000 })

    return res.json({
      message: 'ok',
      address: data.address,
      chainId: data.chainId,
      token
    });
  } catch (e) {
    return res.status(400).json({ message: e?.message || 'verify failed' });
  }
});

export default router;
