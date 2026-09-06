#!/usr/bin/env bash
# USSF 2026 - Запуск локального сервера прийому тез
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE="$DIR/.server.pid"
LOGFILE="$DIR/server.log"

if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[УВАГА] Сервер USSF вже працює (PID: $PID) на http://localhost:5050"
        exit 0
    fi
fi

fuser -k 5050/tcp 2>/dev/null || true
sleep 0.5
nohup python3 -u "$DIR/mailer_server.py" > "$LOGFILE" 2>&1 &
PID=$!
disown "$PID" 2>/dev/null || true
echo "$PID" > "$PIDFILE"

echo "================================================================"
echo " [УСПІХ] Сервер USSF 2026 запущено!"
echo " Адреса сайту:     http://localhost:5050"
echo " Папка для тез:    $DIR/заявки_тези/"
echo " Лог-файл:         $LOGFILE"
echo "================================================================"
