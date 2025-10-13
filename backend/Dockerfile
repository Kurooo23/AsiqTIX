# ---- build stage (node modules) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app

# Non-root user (lebih aman)
RUN addgroup -S app && adduser -S app -G app
USER app

ENV NODE_ENV=production

# Salin dependencies & source
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Expose port
EXPOSE 3001

# Start
CMD ["node", "src/server.js"]
