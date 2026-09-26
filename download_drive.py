import urllib.request
import re
import os
import sys

def download_gdrive_file(file_id, output_path):
    print(f"Downloading Google Drive file {file_id} to {output_path}...")
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )
    
    with urllib.request.urlopen(req) as resp:
        content_disposition = resp.headers.get("Content-Disposition", "")
        content_type = resp.headers.get("Content-Type", "")
        data = resp.read()
        
        # Check if there is a confirm token for large files or HTML warning
        if b"confirm=" in data or b"Google Drive - Virus scan warning" in data:
            match = re.search(r'confirm=([0-9A-Za-z_]+)', data.decode('utf-8', errors='ignore'))
            if match:
                confirm_token = match.group(1)
                url_confirm = f"https://drive.google.com/uc?export=download&id={file_id}&confirm={confirm_token}"
                req_confirm = urllib.request.Request(
                    url_confirm,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                )
                with urllib.request.urlopen(req_confirm) as resp2:
                    data = resp2.read()
                    content_disposition = resp2.headers.get("Content-Disposition", "")
                    content_type = resp2.headers.get("Content-Type", "")

        print(f"Downloaded {len(data)} bytes. Content-Type: {content_type}, Disposition: {content_disposition}")
        
        # Check if it returned an HTML error/login page
        if b"<html" in data[:100].lower():
            # Let's inspect the HTML title or message
            match_title = re.search(r'<title>(.*?)</title>', data.decode('utf-8', errors='ignore'), re.I)
            title = match_title.group(1) if match_title else "Unknown"
            print(f"Warning: Response seems to be HTML page ('{title}')")

        with open(output_path, "wb") as f:
            f.write(data)
        print(f"Saved successfully to {output_path}")

if __name__ == "__main__":
    file_id = "1ODm2PHVUEpBjCBP16ypbWFBVliW6mMjy"
    os.makedirs("images/favicon", exist_ok=True)
    download_gdrive_file(file_id, "images/favicon/fav_downloaded.bin")
