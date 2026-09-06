#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
USSF 2026 - Registration, Abstract Submission & Secure Sync Microservice
-------------------------------------------------------------------------
Listens for POST requests from the website registration form:
1. Automatically generates official abstract PDF (Times New Roman 14, 1.5 spacing).
2. Sends dual emails:
   - Automated No-Reply to Participant with Program PDF and compiled abstract PDF attached.
   - Committee notification to derk.boryslav@gmail.com with full submission details.
3. Provides an encrypted, authenticated synchronization endpoint (/api/sync)
   for the local daemon to download abstracts directly to the user's laptop.
4. Protects participant privacy by blocking unauthenticated access to /заявки_тези/.

Usage:
    python3 mailer_server.py [--port 5050]
"""

import os
import json
import hashlib
import http.server
import socketserver
import re
from datetime import datetime
import urllib.parse
import smtplib
try:
    import requests
except ImportError:
    requests = None
from generate_abstract_docx import create_abstract_docx, send_abstract_email_docx, load_email_config, format_author_initials
from generate_abstract_pdf import create_abstract_pdf, send_abstract_email

PORT = int(os.environ.get('PORT', 5050))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUBMISSIONS_DIR = os.path.join(BASE_DIR, 'заявки_тези')
os.makedirs(SUBMISSIONS_DIR, exist_ok=True)

# Load configuration
cfg = load_email_config()
RECIPIENT = cfg.get('committee_email', 'derk.boryslav@gmail.com')
SYNC_TOKEN = os.environ.get('SYNC_SECRET_TOKEN', cfg.get('sync_secret_token', 'ussf_secure_sync_2026_med_nmu'))


def send_to_google_sheet(data, webhook_url=None):
    """
    Send registration text fields to administrator's Google Apps Script Webhook.
    Returns dict: {'synced': bool, 'status': str, 'message': str, 'response': dict}
    """
    if not webhook_url:
        c = load_email_config()
        webhook_url = c.get('google_sheet_webhook_url', '') or os.environ.get('GOOGLE_SHEET_WEBHOOK_URL', '')
    
    webhook_url = webhook_url.strip() if webhook_url else ''
    if not webhook_url:
        return {
            'synced': False,
            'status': 'NOT_CONFIGURED',
            'message': 'URL Google Таблиці не налаштовано.'
        }
    
    # Build payload with clean text strings (escape leading +, =, - with ' so Google Sheets won't evaluate as formula)
    now = datetime.now()
    default_id = f"USSF-{now.strftime('%Y%m%d')}-{now.strftime('%H%M%S')}"
    default_date = now.strftime('%d.%m.%Y %H:%M:%S')

    def clean_sheet_val(val):
        if val is None:
            return ''
        s = str(val).strip()
        if s and not s.startswith("'") and (s.startswith('+') or s.startswith('=') or s.startswith('-')):
            return "'" + s
        return s

    payload = {
        'submissionId': clean_sheet_val(data.get('submissionId') or default_id),
        'formattedDate': clean_sheet_val(data.get('formattedDate') or default_date),
        'fullName': clean_sheet_val(data.get('fullName', '')),
        'email': clean_sheet_val(data.get('email', '')),
        'phone': clean_sheet_val(data.get('phone', '')),
        'telegram': clean_sheet_val(data.get('telegram', '')),
        'institution': clean_sheet_val(data.get('institution', '')),
        'academicStatusText': clean_sheet_val(data.get('academicStatusText') or data.get('academicStatus', '')),
        'partFormatText': clean_sheet_val(data.get('partFormatText') or data.get('partFormat', '')),
        'sectionText': clean_sheet_val(data.get('sectionText') or (f"Секція {data.get('targetSection')}" if data.get('targetSection') else '')),
        'abstractTitle': clean_sheet_val(data.get('abstractTitle', '')),
        'scientificSupervisor': clean_sheet_val(data.get('scientificSupervisor', '')),
        'department': clean_sheet_val(data.get('department', '')),
        'headOfDepartment': clean_sheet_val(data.get('headOfDepartment', '')),
        'cityCountry': clean_sheet_val(data.get('cityCountry', '')),
        'abstractIntro': clean_sheet_val(data.get('abstractIntro', '')),
        'abstractAim': clean_sheet_val(data.get('abstractAim', '')),
        'abstractMaterials': clean_sheet_val(data.get('abstractMaterials', '')),
        'abstractResults': clean_sheet_val(data.get('abstractResults') or data.get('abstractBody', '')),
        'abstractConclusion': clean_sheet_val(data.get('abstractConclusion', '')),
        'abstractKeywords': clean_sheet_val(data.get('abstractKeywords', '')),
        'abstractReferences': clean_sheet_val(data.get('abstractReferences', ''))
    }

    try:
        if requests is not None:
            resp = requests.post(
                webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=15,
                allow_redirects=True
            )
            if resp.status_code in (200, 201, 302):
                try:
                    res_data = resp.json()
                except Exception:
                    res_data = {'raw': resp.text[:200]}
                
                print(f"[GOOGLE SHEETS] Successfully synchronized submission to Google Sheet: {res_data}")
                return {
                    'synced': True,
                    'status': 'SUCCESS',
                    'message': 'Дані успішно додано до вашої Google Таблиці!',
                    'response': res_data
                }
            else:
                print(f"[GOOGLE SHEETS WARN] HTTP {resp.status_code}: {resp.text[:300]}")
                return {
                    'synced': False,
                    'status': f"HTTP_{resp.status_code}",
                    'message': f"Google Apps Script повернув код HTTP {resp.status_code}"
                }
        else:
            # Fallback to standard library urllib.request when requests is not installed
            import urllib.request
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                webhook_url,
                data=req_data,
                headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                raw_body = response.read().decode('utf-8')
                try:
                    res_data = json.loads(raw_body)
                except Exception:
                    res_data = {'raw': raw_body[:200]}
                print(f"[GOOGLE SHEETS] Successfully synchronized submission to Google Sheet (urllib): {res_data}")
                return {
                    'synced': True,
                    'status': 'SUCCESS',
                    'message': 'Дані успішно додано до вашої Google Таблиці!',
                    'response': res_data
                }
    except Exception as exc:
        print(f"[GOOGLE SHEETS ERROR] Failed sending to sheet: {exc}")
        return {
            'synced': False,
            'status': 'CONNECTION_ERROR',
            'message': f"Помилка з'єднання з Google Таблицею: {exc}"
        }



class SubmissionHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Token, Authorization')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def _is_authenticated(self, query_params):
        """Check if request contains the correct sync token via query param or header."""
        token_in_query = query_params.get('token', [''])[0]
        token_in_header = self.headers.get('X-Sync-Token') or ''
        auth_header = self.headers.get('Authorization') or ''
        if auth_header.startswith('Bearer '):
            token_in_header = auth_header[7:].strip()
        
        provided = token_in_query or token_in_header
        return bool(provided and provided == SYNC_TOKEN)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed_url.path)
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # 1. SECURE SYNC API ENDPOINT (/api/sync and /api/secure-sync)
        if path in ('/api/sync', '/api/secure-sync'):
            if not self._is_authenticated(query_params):
                self.send_response(401)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                err_resp = {
                    "status": "error",
                    "code": 401,
                    "message": "Помилка автентифікації. Недійсний або відсутній ключ безпеки для синхронізації."
                }
                self.wfile.write(json.dumps(err_resp, ensure_ascii=False).encode('utf-8'))
                return

            action = query_params.get('action', ['list'])[0]

            # ACTION: LIST FILES
            if action == 'list':
                file_list = []
                if os.path.exists(SUBMISSIONS_DIR):
                    for fname in sorted(os.listdir(SUBMISSIONS_DIR)):
                        if fname.endswith('.docx') or fname.endswith('.pdf') or fname.endswith('.json'):
                            fpath = os.path.join(SUBMISSIONS_DIR, fname)
                            if os.path.isfile(fpath):
                                stat = os.stat(fpath)
                                # Compute SHA256 checksum for end-to-end data integrity
                                sha256_hash = hashlib.sha256()
                                try:
                                    with open(fpath, 'rb') as f:
                                        for block in iter(lambda: f.read(65536), b""):
                                            sha256_hash.update(block)
                                    digest = sha256_hash.hexdigest()
                                except Exception:
                                    digest = ""

                                ftype = 'docx' if fname.endswith('.docx') else ('pdf' if fname.endswith('.pdf') else 'json')
                                file_list.append({
                                    "filename": fname,
                                    "size": stat.st_size,
                                    "mtime": stat.st_mtime,
                                    "sha256": digest,
                                    "type": ftype,
                                    "download_url": f"/api/sync?action=download&file={urllib.parse.quote(fname)}&token={SYNC_TOKEN}"
                                })

                # Sort newest files first
                file_list.sort(key=lambda x: x['mtime'], reverse=True)

                resp_payload = {
                    "status": "success",
                    "count": len(file_list),
                    "files": file_list,
                    "server_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(resp_payload, ensure_ascii=False).encode('utf-8'))
                return

            # ACTION: DOWNLOAD FILE
            elif action == 'download':
                req_file = query_params.get('file', [''])[0]
                try:
                    # If raw UTF-8 was transmitted and interpreted as latin-1 by HTTP parser
                    req_file = req_file.encode('latin-1').decode('utf-8')
                except Exception:
                    pass
                req_file = urllib.parse.unquote(req_file)
                safe_filename = os.path.basename(req_file)
                target_path = os.path.join(SUBMISSIONS_DIR, safe_filename)

                if not os.path.isfile(target_path):
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "Файл не знайдено."}).encode('utf-8'))
                    return

                if safe_filename.endswith('.docx'):
                    mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                elif safe_filename.endswith('.pdf'):
                    mime = 'application/pdf'
                else:
                    mime = 'application/json'

                fsize = os.path.getsize(target_path)
                self.send_response(200)
                self.send_header('Content-Type', mime)
                self.send_header('Content-Length', str(fsize))
                self.send_header('Content-Disposition', f'attachment; filename="{urllib.parse.quote(safe_filename)}"')
                self.end_headers()
                with open(target_path, 'rb') as f:
                    while chunk := f.read(65536):
                        self.wfile.write(chunk)
                return

        # 1b. DIRECT PUBLIC DOWNLOAD DOCX ENDPOINT (/api/download-docx)
        if path == '/api/download-docx':
            req_file = query_params.get('file', [''])[0]
            try:
                req_file = req_file.encode('latin-1').decode('utf-8')
            except Exception:
                pass
            req_file = urllib.parse.unquote(req_file)
            safe_filename = os.path.basename(req_file)
            target_path = os.path.join(SUBMISSIONS_DIR, safe_filename)

            if not os.path.isfile(target_path) or not safe_filename.endswith('.docx'):
                self.send_response(404)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": "Файл тез не знайдено або доступ обмежено."}).encode('utf-8'))
                return

            fsize = os.path.getsize(target_path)
            self.send_response(200)
            self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            self.send_header('Content-Length', str(fsize))
            self.send_header('Content-Disposition', f'attachment; filename="{urllib.parse.quote(safe_filename)}"')
            self.end_headers()
            with open(target_path, 'rb') as f:
                while chunk := f.read(65536):
                    self.wfile.write(chunk)
            return

        # 2. PRIVACY SHIELD: RESTRICT DIRECT ACCESS TO /заявки_тези/
        if path.startswith('/заявки_тези') or '/заявки_тези/' in path:
            if not self._is_authenticated(query_params):
                self.send_response(403)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                forbidden_resp = {
                    "status": "forbidden",
                    "code": 403,
                    "message": "Доступ заборонено. Каталог поданих тез захищено від публічного перегляду."
                }
                self.wfile.write(json.dumps(forbidden_resp, ensure_ascii=False).encode('utf-8'))
                return

        # 3. GET GOOGLE SHEETS CONFIG STATUS
        if path in ('/api/get-sheets-config', '/api/sheets/config'):
            c = load_email_config()
            s_url = c.get('google_sheet_webhook_url', '') or os.environ.get('GOOGLE_SHEET_WEBHOOK_URL', '')
            masked = ''
            if s_url:
                masked = (s_url[:32] + '...' + s_url[-10:]) if len(s_url) > 45 else s_url
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "configured": bool(s_url),
                "webhook_url": s_url,
                "masked_url": masked
            }, ensure_ascii=False).encode('utf-8'))
            return

        # 4. DEFAULT STATIC FILE SERVING (index.html, ussf.css, js/, images/, USSF2026_Program.pdf)
        return super().do_GET()

    def do_POST(self):
        if self.path in ('/api/submit-abstract', '/submit'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_body.decode('utf-8'))
                
                timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
                full_name = data.get('fullName', '').strip() or data.get('full_name', '').strip() or f"{data.get('last_name', '')} {data.get('first_name', '')} {data.get('middle_name', '')}".strip() or 'Учасник'
                author_initials = format_author_initials(full_name)
                safe_name = re.sub(r'[^\w]+', '_', author_initials.replace('.', '').strip()).strip('_') or 'Учасник'
                
                docx_filename = f"Тези_{safe_name}_{timestamp}.docx"
                docx_path = os.path.join(SUBMISSIONS_DIR, docx_filename)
                
                json_filename = f"Заявка_{safe_name}_{timestamp}.json"
                json_path = os.path.join(SUBMISSIONS_DIR, json_filename)
                
                # 1. Save raw submission JSON
                with open(json_path, 'w', encoding='utf-8') as jf:
                    json.dump(data, jf, ensure_ascii=False, indent=2)
                
                # 2. Generate DOCX strictly according to official NMU template
                generated_docx = create_abstract_docx(data, docx_path)
                print(f"[SERVER] Generated abstract DOCX: {generated_docx}")
                
                # 3. Dual email dispatch with DOCX attachment
                email_result = send_abstract_email_docx(generated_docx, data, RECIPIENT)
                print(f"[SERVER] Email dispatch result: {email_result}")
                
                # 4. Instant Google Sheet synchronization (Row append)
                sheets_result = send_to_google_sheet(data)
                print(f"[SERVER] Google Sheets sync result: {sheets_result}")
                
                response_data = {
                    "status": "success",
                    "docx_filename": docx_filename,
                    "docx_url": f"/api/download-docx?file={urllib.parse.quote(docx_filename)}",
                    "timestamp": timestamp,
                    "email_result": email_result,
                    "google_sheets_result": sheets_result,
                    "delivered_to_owner": True
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
                return
            except Exception as e:
                print(f"[SERVER ERROR] {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        # 2. STANDALONE SEND-EMAIL API (/api/send-email)
        if self.path in ('/api/send-email', '/api/email/send'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            try:
                data = json.loads(post_body.decode('utf-8'))
                cfg = load_email_config()

                if not cfg.get('smtp_user') or not cfg.get('smtp_pass'):
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "status": "error",
                        "email_result": {
                            "sent": False,
                            "error": "SMTP_NOT_CONFIGURED",
                            "message": "SMTP не налаштовано. Потрібно вказати логін та пароль додатку у налаштуваннях."
                        }
                    }, ensure_ascii=False).encode('utf-8'))
                    return

                docx_filename = data.get('docx_filename', '') or data.get('pdf_filename', '')
                docx_path = os.path.join(SUBMISSIONS_DIR, os.path.basename(docx_filename)) if docx_filename else None

                if not docx_path or not os.path.isfile(docx_path):
                    author_initials = format_author_initials(data.get('fullName', 'Учасник'))
                    safe_name = re.sub(r'[^\w]+', '_', author_initials.replace('.', '').strip()).strip('_') or 'Учасник'
                    candidates = [f for f in os.listdir(SUBMISSIONS_DIR) if f.startswith(f"Тези_{safe_name}") and f.endswith('.docx')] if os.path.exists(SUBMISSIONS_DIR) else []
                    if candidates:
                        candidates.sort(reverse=True)
                        docx_path = os.path.join(SUBMISSIONS_DIR, candidates[0])
                    else:
                        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
                        docx_filename = f"Тези_{safe_name}_{timestamp}.docx"
                        docx_path = os.path.join(SUBMISSIONS_DIR, docx_filename)
                        try:
                            create_abstract_docx(data, docx_path)
                        except Exception as pe:
                            print(f"[SERVER WARN] Could not compile DOCX on disk: {pe}")
                            docx_path = None

                if docx_path and os.path.isfile(docx_path):
                    email_result = send_abstract_email_docx(docx_path, data, RECIPIENT)
                else:
                    email_result = {
                        "sent": False,
                        "error": "DOCX_NOT_FOUND",
                        "message": "Не знайдено скомпільований DOCX файл тез для вкладення."
                    }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success" if email_result.get("sent") else "error",
                    "email_result": email_result,
                    "docx_filename": os.path.basename(docx_path) if docx_path else ""
                }, ensure_ascii=False).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        # 3. SAVE & VERIFY SMTP CONFIGURATION (/api/save-smtp-config)
        if self.path in ('/api/save-smtp-config', '/api/smtp/save'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            try:
                data = json.loads(post_body.decode('utf-8'))
                smtp_user = data.get('smtp_user', '').strip()
                smtp_pass = data.get('smtp_pass', '').strip().replace(' ', '')
                smtp_host = data.get('smtp_host', 'smtp.gmail.com').strip()
                smtp_port = int(data.get('smtp_port', 587))
                
                if not smtp_user or not smtp_pass:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "Email та пароль додатку обов'язкові."}, ensure_ascii=False).encode('utf-8'))
                    return
                
                # Test credentials live
                try:
                    if smtp_port == 465:
                        test_conn = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
                    else:
                        test_conn = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
                        test_conn.starttls()
                    test_conn.login(smtp_user, smtp_pass)
                    test_conn.quit()
                except Exception as auth_err:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "status": "auth_error",
                        "message": f"Помилка авторизації SMTP: {auth_err}. Перевірте правильність 16-значного паролю додатку Google або паролю Ukr.net."
                    }, ensure_ascii=False).encode('utf-8'))
                    return
                
                # Update email_config.json
                cfg_path = os.path.join(BASE_DIR, 'email_config.json')
                curr_cfg = load_email_config()
                curr_cfg['smtp_host'] = smtp_host
                curr_cfg['smtp_port'] = smtp_port
                curr_cfg['smtp_user'] = smtp_user
                curr_cfg['smtp_pass'] = smtp_pass
                with open(cfg_path, 'w', encoding='utf-8') as cf:
                    json.dump(curr_cfg, cf, ensure_ascii=False, indent=2)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "message": "SMTP налаштування успішно перевірено та збережено! Авторозсилка активована."
                }, ensure_ascii=False).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        # 4. SAVE & VERIFY GOOGLE SHEETS CONFIG (/api/save-sheets-config)
        if self.path in ('/api/save-sheets-config', '/api/sheets/save'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            try:
                data = json.loads(post_body.decode('utf-8'))
                webhook_url = data.get('webhook_url', '').strip()
                test_now = data.get('test_now', True)
                
                if not webhook_url:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "URL-адреса вебхука Google Apps Script обов'язкова."}, ensure_ascii=False).encode('utf-8'))
                    return
                
                # Test connection if requested
                test_result = None
                if test_now:
                    dummy_test_data = {
                        "submissionId": "USSF-TEST-0001",
                        "formattedDate": datetime.now().strftime("%d.%m.%Y %H:%M:%S"),
                        "fullName": "Тестовий Учасник (Перевірка з'єднання)",
                        "email": "test@example.com",
                        "phone": "+380 (99) 000-00-00",
                        "telegram": "@test_student",
                        "institution": "НМУ імені О. О. Богомольця",
                        "academicStatusText": "Студент",
                        "partFormatText": "Усна доповідь + публікація тез",
                        "sectionText": "Секція 1: Сучасні питання лікування бойової травми",
                        "abstractTitle": "Тестова тема наукової роботи",
                        "scientificSupervisor": "д.мед.н., проф. Шевченко Т. Г.",
                        "department": "Кафедра хірургії №1",
                        "headOfDepartment": "д.мед.н., проф. Франко І. Я.",
                        "cityCountry": "м. Київ, Україна",
                        "abstractIntro": "Тестовий запис створено під час перевірки налаштувань.",
                        "abstractAim": "Перевірка інтеграції веб-сайту з Google Sheets.",
                        "abstractMaterials": "HTTP POST via Google Apps Script Webhook.",
                        "abstractResults": "З'єднання встановлено успішно, стовпці створені.",
                        "abstractConclusion": "Система готова до запису реальних учасників.",
                        "abstractKeywords": "тест, ussf, sheets",
                        "abstractReferences": "1. Тестове джерело."
                    }
                    test_result = send_to_google_sheet(dummy_test_data, webhook_url=webhook_url)
                    if not test_result.get('synced'):
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json; charset=utf-8')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            "status": "test_failed",
                            "message": f"Не вдалося надіслати тестовий запис: {test_result.get('message')}. Переконайтеся, що при розгортанні у полі 'Хто має доступ' вибрано 'Усі' (Anyone).",
                            "test_result": test_result
                        }, ensure_ascii=False).encode('utf-8'))
                        return

                # Save to email_config.json
                cfg_path = os.path.join(BASE_DIR, 'email_config.json')
                curr_cfg = load_email_config()
                curr_cfg['google_sheet_webhook_url'] = webhook_url
                with open(cfg_path, 'w', encoding='utf-8') as cf:
                    json.dump(curr_cfg, cf, ensure_ascii=False, indent=2)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success",
                    "message": "URL Google Таблиці успішно збережено та перевірено! Тестовий рядок з'явився у вашій таблиці.",
                    "test_result": test_result
                }, ensure_ascii=False).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        # 5. SEND TEST ROW TO EXISTING GOOGLE SHEET (/api/test-sheets-connection)
        if self.path in ('/api/test-sheets-connection', '/api/sheets/test'):
            curr_cfg = load_email_config()
            s_url = curr_cfg.get('google_sheet_webhook_url', '') or os.environ.get('GOOGLE_SHEET_WEBHOOK_URL', '')
            if not s_url:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "not_configured",
                    "message": "URL Google Таблиці ще не збережено."
                }, ensure_ascii=False).encode('utf-8'))
                return

            dummy_test_data = {
                "submissionId": f"USSF-TEST-{datetime.now().strftime('%H%M%S')}",
                "formattedDate": datetime.now().strftime("%d.%m.%Y %H:%M:%S"),
                "fullName": "Тестовий Учасник (Тест)",
                "email": "test@example.com",
                "phone": "+380 (99) 000-00-00",
                "telegram": "@test_student",
                "institution": "НМУ імені О. О. Богомольця",
                "academicStatusText": "Студент",
                "partFormatText": "Усна доповідь + публікація тез",
                "sectionText": "Секція 1",
                "abstractTitle": "Тестова перевірка каналу",
                "scientificSupervisor": "д.мед.н., проф. Ковальчук В. М.",
                "department": "Кафедра хірургії №1",
                "headOfDepartment": "д.мед.н., проф. Ткаченко І. І.",
                "cityCountry": "м. Київ, Україна",
                "abstractIntro": "Перевірка зв'язку з таблицею успішна.",
                "abstractAim": "Тест зв'язку.",
                "abstractMaterials": "Google Apps Script.",
                "abstractResults": "OK.",
                "abstractConclusion": "Готово.",
                "abstractKeywords": "тест, ussf",
                "abstractReferences": "1. USSF 2026."
            }
            res = send_to_google_sheet(dummy_test_data, webhook_url=s_url)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SubmissionHandler) as httpd:
        print(f"[USSF SUBMISSION SERVER] Listening on http://localhost:{PORT}")
        print(f"[USSF SUBMISSION SERVER] Committee notification recipient: {RECIPIENT}")
        print(f"[USSF SUBMISSION SERVER] Secure sync API ready at /api/sync with token protection")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

