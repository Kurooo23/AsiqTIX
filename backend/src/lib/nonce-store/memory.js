const TTL_MS = (Number(process.env.NONCE_TTL_SECONDS) || 120) * 1000;
const store = new Map(); // key -> { nonce, exp }

export async function setNonce(key, nonce) {
  store.set(key.toLowerCase(), { nonce, exp: Date.now() + TTL_MS });
}

export async function getNonce(key) {
  const k = key.toLowerCase();
  const v = store.get(k);
  if (!v) return null;
  if (Date.now() > v.exp) {
    store.delete(k);
    return null;
  }
  return v.nonce;
}

export async function deleteNonce(key) {
  store.delete(key.toLowerCase());
}

// pembersihan berkala
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now > v.exp) store.delete(k);
  }
}, 60_000).unref?.();
