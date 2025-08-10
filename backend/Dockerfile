# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
# Install OS packages for Prisma (openssl)
RUN apk add --no-cache openssl
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
# Generate Prisma client using dev dependency CLI
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
# Copy production deps and generated Prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY backend/package.json ./package.json
# Copy prisma schema and migrations for migrate deploy
COPY backend/prisma ./prisma
# Expose Fastify port
EXPOSE 3001
# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"] 