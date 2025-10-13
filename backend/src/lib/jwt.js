import jwt from 'jsonwebtoken';
const { JWT_SECRET = 'dev' } = process.env;

export function signToken(payload, expiresIn = '1d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
