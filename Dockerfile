# ==================================
# Board Observer - Frontend Dockerfile
# Multi-stage build for Next.js
# ==================================
# Port: 4280 (non-standard to avoid conflicts)
# ==================================

# -----------------------------
# Stage 1: Dependencies
# -----------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Install libc6-compat for Alpine
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production=false

# -----------------------------
# Stage 2: Builder
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build argument for API URL (can be overridden at build time)
ARG NEXT_PUBLIC_API_URL=http://localhost:4281
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the application
RUN npm run build

# -----------------------------
# Stage 3: Production Runner
# -----------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port 4280 (Board Observer standard port)
EXPOSE 4280

# Set runtime environment
ENV PORT=4280
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4280 || exit 1

# Start the application
CMD ["node", "server.js"]
