# Multi-stage Dockerfile for Isles of Hexara Authoritative Game Server
FROM node:20-alpine AS builder

WORKDIR /app

# Enable Corepack and pnpm
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

# Copy root configurations and workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/game-core/package.json ./packages/game-core/
COPY packages/protocol/package.json ./packages/protocol/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/shared ./packages/shared
COPY packages/game-core ./packages/game-core
COPY packages/protocol ./packages/protocol
COPY apps/server ./apps/server

# Build shared packages and server
RUN pnpm --filter @hexara/shared build && \
    pnpm --filter @hexara/game-core build && \
    pnpm --filter @hexara/protocol build && \
    pnpm --filter @hexara/server build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY --from=builder /app ./

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["pnpm", "--filter", "@hexara/server", "start"]
