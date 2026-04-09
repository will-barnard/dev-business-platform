# Build frontend-root
FROM node:20-alpine AS build-root
WORKDIR /app
COPY packages/frontend-root/package*.json ./
RUN npm install
COPY packages/frontend-root/ .
RUN npm run build

# Build frontend-studio (depends on build-root so BuildKit runs these sequentially,
# preventing three parallel npm install + vite build processes from OOMing the VM)
FROM node:20-alpine AS build-studio
COPY --from=build-root /app/dist/index.html /tmp/seq-trigger
WORKDIR /app
COPY packages/frontend-studio/package*.json ./
RUN npm install
COPY packages/frontend-studio/ .
RUN npm run build

# Build frontend-admin (depends on build-studio for same reason)
FROM node:20-alpine AS build-admin
COPY --from=build-studio /app/dist/index.html /tmp/seq-trigger
WORKDIR /app
COPY packages/frontend-admin/package*.json ./
RUN npm install
COPY packages/frontend-admin/ .
RUN npm run build

# Final nginx image — serves all three sites
FROM nginx:alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-root /app/dist /usr/share/nginx/html/root
COPY --from=build-studio /app/dist /usr/share/nginx/html/studio
COPY --from=build-admin /app/dist /usr/share/nginx/html/admin
EXPOSE 80
