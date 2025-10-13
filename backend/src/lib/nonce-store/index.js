const useRedis = String(process.env.USE_REDIS || 'false').toLowerCase() === 'true';

let impl;
if (useRedis) {
  impl = await import('./redis.js');
  console.log('[nonce-store] Using Redis backend');
} else {
  impl = await import('./memory.js');
  console.log('[nonce-store] Using in-memory backend');
}

export const setNonce = impl.setNonce;
export const getNonce = impl.getNonce;
export const deleteNonce = impl.deleteNonce;
