# Этап 1: Сборка React-приложения
FROM node:18-alpine AS build
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап 2: Настройка Nginx для раздачи статики
FROM nginx:alpine

# Копируем собранные файлы в папку Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Копируем нашу конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]