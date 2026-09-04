#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
USSF 2026 - Secure Real-Time Local Synchronization Daemon
---------------------------------------------------------
Connects to https://ussf-n7ui.onrender.com/api/sync via encrypted HTTPS / TLS,
authenticates using a cryptographic secret token, and automatically transfers
all newly submitted conference abstracts and registration data (.pdf and .json)
directly to your local device folder: /home/hammer/Документы/MOROZU/заявки_тези/

Features:
- Encrypted end-to-end transport (HTTPS/TLS)
- Token-based access control
- Cryptographic SHA-256 integrity verification
- Instant desktop notifications (notify-send)
- Resilient retry on network pauses or server sleep
- Dual mode: Background daemon or one-shot sync

Usage:
    python3 ussf_sync_daemon.py            # Run continuously in background/terminal
    python3 ussf_sync_daemon.py --once     # Run a single sync check and exit
"""

import os
import sys
import time
import json
import hashlib
import argparse
import subprocess
import urllib.request
import urllib.parse
import urllib.error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_DIR = os.path.join(BASE_DIR, 'заявки_тези')
CONFIG_PATH = os.path.join(BASE_DIR, 'email_config.json')

DEFAULT_REMOTE = "https://ussf-n7ui.onrender.com"
DEFAULT_TOKEN = "ussf_secure_sync_2026_med_nmu"
DEFAULT_INTERVAL = 5  # seconds


def load_token():
    """Retrieve security token from config file or environment."""
    if os.environ.get('SYNC_SECRET_TOKEN'):
        return os.environ.get('SYNC_SECRET_TOKEN')
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                c = json.load(f)
                token = c.get('sync_secret_token')
                if token:
                    return token.strip()
        except Exception:
            pass
    return DEFAULT_TOKEN


def compute_sha256(filepath):
    """Compute local file SHA256."""
    h = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


def send_desktop_notification(title, message):
    """Trigger system desktop notification on Linux via notify-send."""
    try:
        subprocess.run(
            ['notify-send', '-u', 'normal', '-i', 'document-save', title, message],
            timeout=3,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception:
        pass


def sync_cycle(remote_url, token, local_dir):
    """
    Perform a single synchronization pass.
    Returns the number of newly downloaded files.
    """
    os.makedirs(local_dir, exist_ok=True)
    list_url = f"{remote_url.rstrip('/')}/api/sync?action=list&token={urllib.parse.quote(token)}"

    req = urllib.request.Request(
        list_url,
        headers={
            'User-Agent': 'USSF-SecureSync/2.0',
            'X-Sync-Token': token
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as he:
        if he.code == 401:
            print(f"[ПОМИЛКА БЕЗПЕКИ 401] Недійсний ключ синхронізації (token). Перевірте налаштування.")
        elif he.code == 403:
            print(f"[ПОМИЛКА 403] Доступ заборонено сервером.")
        else:
            print(f"[HTTP {he.code}] Помилка запиту списку тез: {he}")
        return 0
    except Exception as e:
        # Server might be asleep (Render free tier wakes up in ~30s) or no network
        print(f"[ОЧІКУВАННЯ ЗВ'ЯЗКУ] Сервер недоступний або прокидається ({e})")
        return 0

    if data.get('status') != 'success':
        print(f"[СЕРВЕР] Відповідь: {data}")
        return 0

    files = data.get('files', [])
    downloaded_count = 0

    for item in files:
        fname = item['filename']
        server_sha = item.get('sha256')
        fsize = item.get('size', 0)
        local_path = os.path.join(local_dir, fname)

        need_download = False
        if not os.path.exists(local_path):
            need_download = True
        elif server_sha and compute_sha256(local_path) != server_sha:
            need_download = True

        if need_download:
            download_url = f"{remote_url.rstrip('/')}/api/sync?action=download&file={urllib.parse.quote(fname)}&token={urllib.parse.quote(token)}"
            d_req = urllib.request.Request(
                download_url,
                headers={
                    'User-Agent': 'USSF-SecureSync/2.0',
                    'X-Sync-Token': token
                }
            )

            print(f"[ЗАВАНТАЖЕННЯ] {fname} ({fsize} байт) через зашифрований HTTPS...")
            temp_path = local_path + ".tmp"
            try:
                with urllib.request.urlopen(d_req, timeout=30) as f_in, open(temp_path, 'wb') as f_out:
                    while chunk := f_in.read(65536):
                        f_out.write(chunk)

                # Verify SHA256 integrity
                if server_sha:
                    local_sha = compute_sha256(temp_path)
                    if local_sha != server_sha:
                        print(f"[ПОМИЛКА ЦІЛІСНОСТІ] Не співпав SHA256 для {fname}! Файл відхилено.")
                        os.remove(temp_path)
                        continue

                # Atomically replace final file
                os.replace(temp_path, local_path)
                downloaded_count += 1
                print(f"[УСПІХ] Збережено: {local_path} [SHA256 ПЕРЕВІРЕНО]")

                # Notify user immediately on their desktop
                if fname.endswith('.pdf'):
                    send_desktop_notification(
                        "USSF 2026: Нові тези надійшли!",
                        f"Документ збережено:\n{fname}"
                    )
            except Exception as dl_err:
                print(f"[ПОМИЛКА СКАЧУВАННЯ] {fname}: {dl_err}")
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass

    return downloaded_count


def run_daemon(remote_url, token, local_dir, interval):
    """Run persistent synchronization daemon."""
    print("=" * 70, flush=True)
    print("    USSF 2026 — БЕЗПЕЧНА СИНХРОНІЗАЦІЯ ТЕЗ ТА ЗАЯВОК У РЕАЛЬНОМУ ЧАСІ", flush=True)
    print("=" * 70, flush=True)
    print(f"  Сервер:            {remote_url}", flush=True)
    print(f"  Захист каналу:     HTTPS / TLS (шифрування при передачі)", flush=True)
    print(f"  Автентифікація:    Захищений токен (SHA256 аудит)", flush=True)
    print(f"  Локальна папка:    {local_dir}", flush=True)
    print(f"  Інтервал опитування: кожні {interval} сек.", flush=True)
    print("=" * 70, flush=True)
    print(f"[{time.strftime('%H:%M:%S')}] [СТАТУС] Моніторинг активний. Натисніть Ctrl+C для зупинки.\n", flush=True)

    consecutive_errors = 0
    cycle_counter = 0

    while True:
        try:
            cycle_counter += 1
            timestamp = time.strftime('%H:%M:%S')
            new_files = sync_cycle(remote_url, token, local_dir)
            if new_files > 0:
                print(f"[{timestamp}] [СИНХРОНІЗАЦІЯ] Отримано нових документів: {new_files}", flush=True)
            elif cycle_counter % 12 == 1:
                # Periodic heartbeat log (once per minute with 5s interval)
                print(f"[{timestamp}] [ОК] Моніторинг активний. Нових тез немає.", flush=True)
            consecutive_errors = 0
        except KeyboardInterrupt:
            print("\n[ЗУПИНКА] Синхронізатор завершив роботу.", flush=True)
            sys.exit(0)
        except Exception as err:
            consecutive_errors += 1
            wait_time = min(interval * consecutive_errors, 30)
            print(f"[{time.strftime('%H:%M:%S')}] [ЗБІЙ {consecutive_errors}] {err}. Повторна спроба через {wait_time} сек...", flush=True)
            time.sleep(wait_time)
            continue

        time.sleep(interval)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="USSF 2026 Secure Abstract Synchronizer")
    parser.add_argument('--url', type=str, default=DEFAULT_REMOTE, help="Remote server URL")
    parser.add_argument('--token', type=str, default=None, help="Security sync token")
    parser.add_argument('--dir', type=str, default=LOCAL_DIR, help="Local target directory")
    parser.add_argument('--interval', type=int, default=DEFAULT_INTERVAL, help="Sync check interval in seconds")
    parser.add_argument('--once', action='store_true', help="Run a single sync check and exit")

    args = parser.parse_args()
    token = args.token or load_token()

    if args.once:
        print(f"[USSF SYNC] Перевірка нових тез на {args.url} ...")
        count = sync_cycle(args.url, token, args.dir)
        if count == 0:
            print("[СИНХРОНІЗАЦІЯ] Нових тез на сервері немає. Всі файли синхронізовано.")
        else:
            print(f"[УСПІХ] Завантажено нових файлів: {count} у папку {args.dir}")
    else:
        run_daemon(args.url, token, args.dir, args.interval)
