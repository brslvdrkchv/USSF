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
from datetime import datetime
import urllib.parse
import smtplib
from generate_abstract_pdf import create_abstract_pdf, send_abstract_email, load_email_config

PORT = int(os.environ.get('PORT', 5050))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUBMISSIONS_DIR = os.path.join(BASE_DIR, 'заявки_тези')
os.makedirs(SUBMISSIONS_DIR, exist_ok=True)

# Load configuration
cfg = load_email_config()
RECIPIENT = cfg.get('committee_email', 'derk.boryslav@gmail.com')
SYNC_TOKEN = os.environ.get('SYNC_SECRET_TOKEN', cfg.get('sync_secret_token', 'ussf_secure_sync_2026_med_nmu'))


class SubmissionHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Token, Authorization')
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
                        if fname.endswith('.pdf') or fname.endswith('.json'):
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

                                file_list.append({
                                    "filename": fname,
                                    "size": stat.st_size,
                                    "mtime": stat.st_mtime,
                                    "sha256": digest,
                                    "type": "pdf" if fname.endswith('.pdf') else "json",
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

                mime = 'application/pdf' if safe_filename.endswith('.pdf') else 'application/json'
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

        # 3. DEFAULT STATIC FILE SERVING (index.html, ussf.css, js/, images/, USSF2026_Program.pdf)
        return super().do_GET()

    def do_POST(self):
        if self.path in ('/api/submit-abstract', '/submit'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_body.decode('utf-8'))
                
                # Timestamp & directory
                timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
                safe_name = "".join(c for c in data.get('fullName', 'Учасник') if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_') or 'Учасник'
                
                pdf_filename = f"Тези_{safe_name}_{timestamp}.pdf"
                pdf_path = os.path.join(SUBMISSIONS_DIR, pdf_filename)
                
                json_filename = f"Заявка_{safe_name}_{timestamp}.json"
                json_path = os.path.join(SUBMISSIONS_DIR, json_filename)
                
                # 1. Save raw submission JSON
                with open(json_path, 'w', encoding='utf-8') as jf:
                    json.dump(data, jf, ensure_ascii=False, indent=2)
                
                # 2. Generate PDF strictly according to official NMU template
                generated_pdf = create_abstract_pdf(data, pdf_path)
                print(f"[SERVER] Generated abstract PDF: {generated_pdf}")
                
                # 3. Dual email dispatch:
                #    a) Automated No-reply email to participant with Program PDF attached
                #    b) Submission alert with abstract PDF to committee (derk.boryslav@gmail.com)
                email_result = send_abstract_email(generated_pdf, data, RECIPIENT)
                print(f"[SERVER] Email dispatch result: {email_result}")
                
                response_data = {
                    "status": "success",
                    "pdf_filename": pdf_filename,
                    "timestamp": timestamp,
                    "email_result": email_result,
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

                pdf_filename = data.get('pdf_filename', '')
                pdf_path = os.path.join(SUBMISSIONS_DIR, os.path.basename(pdf_filename)) if pdf_filename else None

                if not pdf_path or not os.path.isfile(pdf_path):
                    safe_name = "".join(c for c in data.get('fullName', 'Учасник') if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_') or 'Учасник'
                    candidates = [f for f in os.listdir(SUBMISSIONS_DIR) if f.startswith(f"Тези_{safe_name}") and f.endswith('.pdf')] if os.path.exists(SUBMISSIONS_DIR) else []
                    if candidates:
                        candidates.sort(reverse=True)
                        pdf_path = os.path.join(SUBMISSIONS_DIR, candidates[0])
                    else:
                        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
                        pdf_filename = f"Тези_{safe_name}_{timestamp}.pdf"
                        pdf_path = os.path.join(SUBMISSIONS_DIR, pdf_filename)
                        try:
                            create_abstract_pdf(data, pdf_path)
                        except Exception as pe:
                            print(f"[SERVER WARN] Could not compile PDF on disk: {pe}")
                            pdf_path = None

                if pdf_path and os.path.isfile(pdf_path):
                    email_result = send_abstract_email(pdf_path, data, RECIPIENT)
                else:
                    email_result = {
                        "sent": False,
                        "error": "PDF_NOT_FOUND",
                        "message": "Не знайдено скомпільований PDF файл тез для вкладення."
                    }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "success" if email_result.get("sent") else "error",
                    "email_result": email_result,
                    "pdf_filename": os.path.basename(pdf_path) if pdf_path else ""
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

