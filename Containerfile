# Stage 1: Build React frontend
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js .oxlintrc.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# Stage 2: Python runtime
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=builder /app/dist ./dist

RUN mkdir -p /data/audio /data/backups

VOLUME ["/data"]
EXPOSE 8000

ENV DB_PATH=/data/pomodoro.db
ENV AUDIO_DIR=/data/audio
ENV BACKUP_DIR=/data/backups

CMD ["python3", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
