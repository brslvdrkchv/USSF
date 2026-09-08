#!/usr/bin/env bash
# ==============================================================================
# USSF 2026 - Automatic Deployment Script for Google Cloud Compute Engine (e2-micro)
# ==============================================================================
set -e

echo "=== [1/5] Оновлення пакетів та встановлення залежностей ==="
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv git curl debian-keyring debian-archive-keyring apt-transport-https

echo "=== [2/5] Встановлення Caddy Web Server (Автоматичний HTTPS та Reverse Proxy) ==="
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update -y
sudo apt-get install -y caddy

echo "=== [3/5] Створення віртуального оточення Python ==="
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "=== [4/5] Налаштування системної служби systemd (автозапуск 24/7) ==="
CURRENT_USER=$(whoami)
sudo tee /etc/systemd/system/ussf.service > /dev/null <<EOF
[Unit]
Description=USSF 2026 Mailer & Web Service
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/venv/bin/python3 $SCRIPT_DIR/mailer_server.py
Restart=always
RestartSec=5
Environment=PORT=5050
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ussf
sudo systemctl restart ussf

echo "=== [5/5] Налаштування веб-сервера Caddy ==="
sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
:80 {
    reverse_proxy localhost:5050
}
EOF

sudo systemctl restart caddy

echo "=========================================================="
echo "✅ Розгортання успішно завершено!"
echo "Сайт USSF 2026 працює 24/7 і ніколи не засинає."
echo "Перевірити статус служби: sudo systemctl status ussf"
echo "Переглянути логи: sudo journalctl -u ussf -f"
echo "=========================================================="
