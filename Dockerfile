# Multi-stage Dockerfile for Zeno Solar Platform
FROM node:20-alpine AS builder

WORKDIR /app

# Build Client
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# Setup Server
FROM node:20-alpine AS runner

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

WORKDIR /app/server
CMD ["node", "src/server.js"]
