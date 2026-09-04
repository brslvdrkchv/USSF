#!/usr/bin/env bash
# USSF 2026 - Запуск фонового демона безпечної синхронізації
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE="$DIR/.sync.pid"
LOGFILE="$DIR/sync.log"

if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[УВАГА] Фоновий синхронізатор вже працює (PID: $PID)."
        echo "Перевірити стан: ./check_sync.sh"
        echo "Зупинити:        ./stop_sync.sh"
        exit 0
    fi
fi

nohup python3 -u "$DIR/ussf_sync_daemon.py" > "$LOGFILE" 2>&1 &
PID=$!
disown "$PID" 2>/dev/null || true
echo "$PID" > "$PIDFILE"

echo "================================================================"
echo " [УСПІХ] Безпечний синхронізатор USSF 2026 запущено у фоні!"
echo " PID:              $PID"
echo " Лог-файл:         $LOGFILE"
echo " Папка для тез:    $DIR/заявки_тези/"
echo " Шифрування:       HTTPS / TLS"
echo "================================================================"
echo "Корисні команди:"
echo "  ./check_sync.sh   - перевірити активність та переглянути нові файли"
echo "  ./stop_sync.sh    - зупинити фоновий моніторинг"
