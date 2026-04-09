# Build frontend-root
FROM node:20-alpine AS build-root
WORKDIR /app
COPY packages/frontend-root/package*.json ./
RUN npm install
COPY packages/frontend-root/ .
RUN npm run build

# Build frontend-studio
FROM node:20-alpine AS build-studio
WORKDIR /app
COPY packages/frontend-studio/package*.json ./
RUN npm install
COPY packages/frontend-studio/ .
RUN npm run build

# Build frontend-admin
FROM node:20-alpine AS build-admin
WORKDIR /app
COPY packages/frontend-admin/package*.json ./
RUN npm install
COPY packages/frontend-admin/ .
RUN npm run build

# Nginx
FROM nginx:alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-root /app/dist /usr/share/nginx/html/root
COPY --from=build-studio /app/dist /usr/share/nginx/html/studio
COPY --from=build-admin /app/dist /usr/share/nginx/html/admin
EXPOSE 80
