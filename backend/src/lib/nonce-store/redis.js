import Redis from 'ioredis';

const url = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = new Redis(url, { lazyConnect: true });

const TTL = Number(process.env.NONCE_TTL_SECONDS) || 120; // seconds
const PREFIX = 'siwe:nonce:';

let connected = false;
async function ensureConn() {
  if (connected) return;
  await redis.connect();
  connected = true;
}

export async function setNonce(key, nonce) {
  await ensureConn();
  await redis.setex(PREFIX + key.toLowerCase(), TTL, nonce);
}

export async function getNonce(key) {
  await ensureConn();
  return redis.get(PREFIX + key.toLowerCase());
}

export async function deleteNonce(key) {
  await ensureConn();
  await redis.del(PREFIX + key.toLowerCase());
}
