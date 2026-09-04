#!/usr/bin/env bash
# USSF 2026 - Зупинка фонового демона
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE="$DIR/.sync.pid"

if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID"
        rm -f "$PIDFILE"
        echo "[УСПІХ] Фоновий синхронізатор (PID: $PID) зупинено."
        exit 0
    fi
    rm -f "$PIDFILE"
fi

# Fallback kill by process name if pid file was missing
pkill -f "python3.*ussf_sync_daemon.py" > /dev/null 2>&1
echo "[ІНФО] Фоновий синхронізатор не був запущений або вже зупинений."
