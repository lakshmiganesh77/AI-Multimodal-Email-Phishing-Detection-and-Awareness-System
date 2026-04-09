# PhishGuard Frontend Dockerfile (Multi-Stage)
# Stage 1: Build the React app
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (uses layer caching effectively)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build the production bundle
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Serve built assets with Nginx (tiny, production-ready image)
# ---------------------------------------------------------------------------
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
