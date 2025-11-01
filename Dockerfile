# syntax=docker/dockerfile:1

# Build stage: install dependencies and produce optimized static assets
FROM node:22-alpine AS builder

WORKDIR /app

# Accept build argument for backend URL
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Install dependencies using the lockfile when available
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# Runtime stage: serve the built assets with nginx
FROM nginx:1.29-alpine AS runner

# Copy custom nginx configuration for SPA routing and caching headers
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from the previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
