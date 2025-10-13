import { verifyToken } from '../lib/jwt.js';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = verifyToken(token);
    req.user = payload; // { address: '0x...' }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
