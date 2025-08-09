FROM node:20 AS builder

# 1. Собираем клиент
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ .
# Передаём переменную для vite
ARG VITE_WEB_URL
ENV VITE_WEB_URL=$VITE_WEB_URL
RUN npm run build

# 2. Собираем сервер
WORKDIR /server
COPY server/package*.json ./
RUN npm install
COPY server/ .
# Копируем билд фронта в public сервера
RUN mkdir -p public && cp -r /client/dist/* public/
RUN npm run build

# 3. Продакшен образ
FROM node:20
WORKDIR /app
COPY --from=builder /server ./
CMD ["npm", "run", "start:prod"]
