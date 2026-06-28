#!/usr/bin/env bash
set -euo pipefail

IMAGE="pomodoro-app:latest"
CONTAINER="pomodoro"
HOST_DATA="$HOME/Documents/pomodoro-data"
HOST_PORT=8000

# Create host data directories
mkdir -p "$HOST_DATA/audio" "$HOST_DATA/backups"

# Stop and remove existing container if present
if podman container exists "$CONTAINER" 2>/dev/null; then
  echo "[pomodoro] Stopping existing container..."
  podman stop "$CONTAINER" || true
  podman rm "$CONTAINER" || true
fi

# Build the image
echo "[pomodoro] Building image (this takes a minute on first run)..."
podman build -t "$IMAGE" -f Containerfile .

# Run container
echo "[pomodoro] Starting container..."
podman run -d \
  --name "$CONTAINER" \
  -p "$HOST_PORT:8000" \
  -v "$HOST_DATA:/data:Z" \
  "$IMAGE"

echo ""
echo "✓ Pomodoro running at http://localhost:$HOST_PORT"
echo ""
echo "  Audio folder : $HOST_DATA/audio/"
echo "  Backups      : $HOST_DATA/backups/"
echo "  Database     : $HOST_DATA/pomodoro.db"
echo ""
echo "  Logs  : podman logs -f $CONTAINER"
echo "  Stop  : podman stop $CONTAINER"
echo "  Start : podman start $CONTAINER"
