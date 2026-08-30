# ==============================================================================
# Multi-stage Dockerfile for Lighthouse on Google Cloud Run
# Runs as non-root user (node)
# ==============================================================================

FROM node:24-alpine AS build
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build Vite frontend
RUN npm run build

# Runtime stage
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend and server bundle
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Expose Cloud Run default port
EXPOSE 8080

# Use non-root user
USER node

# Start production server
CMD ["node", "dist/server.cjs"]
