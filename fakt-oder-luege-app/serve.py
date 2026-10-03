#!/usr/bin/env python3
"""Startet die App lokal und zeigt die Adresse fürs iPhone (gleiches WLAN)."""
import http.server, socket, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 8080
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("10.255.255.255", 1)); ip = s.getsockname()[0]
except OSError:
    ip = "127.0.0.1"
finally:
    s.close()
print(f"Am Rechner:  http://localhost:{PORT}")
print(f"Am iPhone:   http://{ip}:{PORT}   (gleiches WLAN, in Safari öffnen)")
print("Beenden mit Strg+C")
http.server.ThreadingHTTPServer(("", PORT), http.server.SimpleHTTPRequestHandler).serve_forever()
