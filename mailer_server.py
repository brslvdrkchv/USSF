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
from generate_abstract_pdf import create_abstract_pdf, send_abstract_email

PORT = int(os.environ.get('PORT', 5050))
RECIPIENT = "derk.boryslav@gmail.com"

class SubmissionHandler(http.server.SimpleHTTPRequestHandler):
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
                
                # 1. Generate PDF
                safe_name = "".join(c for c in data.get('fullName', 'Учасник') if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
                pdf_filename = f"Тези_USSF_{safe_name}.pdf"
                pdf_path = os.path.join(os.path.dirname(__file__), pdf_filename)
                
                generated_pdf = create_abstract_pdf(data, pdf_path)
                print(f"[SERVER] Generated abstract PDF: {generated_pdf}")
                
                # 2. Attempt email dispatch
                email_sent = send_abstract_email(generated_pdf, data, RECIPIENT)
                
                response_data = {
                    "status": "success",
                    "pdf_file": pdf_filename,
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
