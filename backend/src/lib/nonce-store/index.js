// Simple in-memory nonce store with TTL (default 5 minutes).
const _store = new Map()
const TTL_MS = Number(process.env.NONCE_TTL_MS || 5 * 60 * 1000)

export async function setNonce(address, nonce) {
  const now = Date.now()
  _store.set(address, { nonce, exp: now + TTL_MS })
  return true
}

export async function getNonce(address) {
  const rec = _store.get(address)
  if (!rec) return null
  const now = Date.now()
  if (rec.exp && rec.exp < now) {
    _store.delete(address)
    return null
  }
  return rec.nonce
}

export async function deleteNonce(address) {
  _store.delete(address)
  return true
}
