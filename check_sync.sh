#!/usr/bin/env bash
# USSF 2026 - Перевірка статусу синхронізації
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE="$DIR/.sync.pid"
LOGFILE="$DIR/sync.log"

echo "================================================================"
echo "              СТАТУС СИНХРОНІЗАЦІЇ USSF 2026"
echo "================================================================"

if [ -f "$PIDFILE" ] && ps -p "$(cat "$PIDFILE")" > /dev/null 2>&1; then
    echo " Стан:          АКТИВНИЙ (працює у фоні, PID: $(cat "$PIDFILE"))"
else
    echo " Стан:          НЕ АКТИВНИЙ"
    echo " Для запуску:   ./start_sync.sh"
fi

echo " Локальна папка: $DIR/заявки_тези/"
COUNT=$(ls -1 "$DIR/заявки_тези"/*.pdf 2>/dev/null | wc -l)
echo " Кількість тез:  $COUNT PDF документів на вашому пристрої"
echo "================================================================"

if [ -f "$LOGFILE" ]; then
    echo "Останні події в лозі ($LOGFILE):"
    tail -n 8 "$LOGFILE"
fi
