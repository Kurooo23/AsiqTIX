# NFT Ticketing — Backend (SIWE)

## Menjalankan (Dev)
1. Salin `.env.example` menjadi `.env`, sesuaikan `CORS_ORIGIN`, `JWT_SECRET`.
2. `npm i`
3. `npm run dev` → http://localhost:3001

## ENV Penting
- `PORT` — default 3001
- `CORS_ORIGIN` — asal frontend (mis. http://localhost:5173 / https://app.domain.com)
- `JWT_SECRET` — kunci rahasia JWT
- `USE_REDIS` — `true` untuk Redis, `false` untuk in-memory
- `REDIS_URL` — url Redis (jika `USE_REDIS=true`)
- `NONCE_TTL_SECONDS` — TTL nonce (default 120 detik)

## Deploy (Docker)
