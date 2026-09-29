#!/usr/bin/env bash
# ==============================================================================
# USSF 2026 - Automatic GitHub Continuous Deployment Watcher
# Runs via cron every minute: checks for remote changes, pulls & reloads.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Prevent concurrent runs
PIDFILE="$SCRIPT_DIR/.deploy.pid"
if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        exit 0
    fi
fi
echo "$$" > "$PIDFILE"
trap 'rm -f "$PIDFILE"' EXIT

# Fetch origin
git fetch origin main > /dev/null 2>&1 || exit 0

LOCAL=$(git rev-parse HEAD 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)

if [ -n "$LOCAL" ] && [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
    echo "=========================================================="
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 New updates detected on GitHub!"
    echo "Local:  $LOCAL"
    echo "Remote: $REMOTE"
    
    # Pull clean
    git pull origin main
    
    # Check if python dependencies need updating
    if [ -d "venv" ] && [ -f "requirements.txt" ]; then
        ./venv/bin/pip install -r requirements.txt > /dev/null 2>&1 || true
    fi
    
    # Restart the systemd service
    if command -v systemctl > /dev/null 2>&1; then
        sudo systemctl restart ussf > /dev/null 2>&1 || true
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Service ussf successfully restarted!"
    fi
    echo "=========================================================="
fi
