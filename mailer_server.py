#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
USSF 2026 - Registration & Abstract Submission Microservice
-----------------------------------------------------------
Listens for POST requests from the website registration form,
automatically generates the official abstract PDF (Times New Roman 14, 1.5 spacing),
and sends it directly to derk.boryslav@gmail.com.

Usage:
    python3 mailer_server.py [--port 5050]
"""

import os
import json
import http.server
import socketserver
from datetime import datetime
import urllib.parse
from generate_abstract_pdf import create_abstract_pdf, send_abstract_email

PORT = int(os.environ.get('PORT', 5050))
RECIPIENT = "derk.boryslav@gmail.com"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class SubmissionHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path in ('/api/submit-abstract', '/submit'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_body.decode('utf-8'))
                
                # Timestamp & directory
                timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
                safe_name = "".join(c for c in data.get('fullName', 'Учасник') if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_') or 'Учасник'
                submissions_dir = os.path.join(BASE_DIR, 'заявки_тези')
                os.makedirs(submissions_dir, exist_ok=True)
                
                pdf_filename = f"Тези_{safe_name}_{timestamp}.pdf"
                pdf_path = os.path.join(submissions_dir, pdf_filename)
                
                json_filename = f"Заявка_{safe_name}_{timestamp}.json"
                json_path = os.path.join(submissions_dir, json_filename)
                
                # Save raw json
                with open(json_path, 'w', encoding='utf-8') as jf:
                    json.dump(data, jf, ensure_ascii=False, indent=2)
                
                # Generate PDF strictly by template
                generated_pdf = create_abstract_pdf(data, pdf_path)
                print(f"[SERVER] Generated abstract PDF: {generated_pdf}")
                
                # Optional email dispatch
                email_sent = send_abstract_email(generated_pdf, data, RECIPIENT)
                
                response_data = {
                    "status": "success",
                    "pdf_filename": pdf_filename,
                    "pdf_path": generated_pdf,
                    "pdf_url": f"http://localhost:{PORT}/заявки_тези/{urllib.parse.quote(pdf_filename)}",
                    "timestamp": timestamp,
                    "email_sent": email_sent,
                    "recipient": RECIPIENT
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
                return
            except Exception as e:
                print(f"[SERVER ERROR] {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), SubmissionHandler) as httpd:
        print(f"[USSF SUBMISSION SERVER] Listening on http://localhost:{PORT}")
        print(f"[USSF SUBMISSION SERVER] Submissions will be sent to: {RECIPIENT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
