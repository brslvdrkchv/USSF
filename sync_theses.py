#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
USSF 2026 - Secure Local Synchronizer
-------------------------------------
Connects to https://ussf-n7ui.onrender.com/api/sync via encrypted HTTPS / TLS,
authenticates with a secret token, and downloads all new abstracts to /заявки_тези/.
"""

import sys
from ussf_sync_daemon import sync_cycle, run_daemon, load_token, DEFAULT_REMOTE, LOCAL_DIR, DEFAULT_INTERVAL

def main():
    if '--daemon' in sys.argv or '-d' in sys.argv:
        token = load_token()
        run_daemon(DEFAULT_REMOTE, token, LOCAL_DIR, DEFAULT_INTERVAL)
    else:
        token = load_token()
        print(f"[USSF SYNC] Підключення до {DEFAULT_REMOTE} через зашифрований HTTPS...")
        new_count = sync_cycle(DEFAULT_REMOTE, token, LOCAL_DIR)
        if new_count == 0:
            print("[СИНХРОНІЗАЦІЯ] Всі надіслані тези вже завантажені на ваш комп'ютер. Нових файлів немає.")
        else:
            print(f"\n[УСПІХ] Завантажено нових файлів: {new_count} у папку {LOCAL_DIR}")

if __name__ == '__main__':
    main()

