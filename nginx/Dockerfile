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

# nginx-root — serves will-barnard.com
FROM nginx:alpine AS nginx-root
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-root /app/dist /usr/share/nginx/html
EXPOSE 80

# nginx-studio — serves studio.will-barnard.com
FROM nginx:alpine AS nginx-studio
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-studio /app/dist /usr/share/nginx/html
EXPOSE 80

# nginx-admin — serves admin.will-barnard.com
FROM nginx:alpine AS nginx-admin
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-admin /app/dist /usr/share/nginx/html
EXPOSE 80
