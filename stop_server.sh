#!/usr/bin/env bash
# USSF 2026 - Зупинка локального сервера
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE="$DIR/.server.pid"

if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    kill "$PID" 2>/dev/null || true
    rm -f "$PIDFILE"
fi
fuser -k 5050/tcp 2>/dev/null || true
echo "[ОК] Сервер USSF зупинено."
