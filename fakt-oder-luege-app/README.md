# Fakt oder Lüge

Zwei-Spieler-Spiel (Joshua gegen Luna) für den iPhone-Home-Bildschirm. Läuft komplett im Browser.

## Starten (lokal)

Auf dem Rechner, im Ordner `fakt-oder-luege-app`:

    python3 serve.py

Das Skript zeigt zwei Adressen. Am iPhone (gleiches WLAN) die zweite Adresse in **Safari** öffnen.

## Auf den Home-Bildschirm

Safari: Teilen-Symbol, dann **Zum Home-Bildschirm**. Danach startet die App im Vollbild.

## Wichtig

- Über `http://<IP>:8080` ist die App nur erreichbar, solange `serve.py` auf dem Rechner läuft. iOS erlaubt Offline-Betrieb (Service Worker) nur über HTTPS oder `localhost` auf demselben Gerät.
- Spielstand und Statistik werden pro Gerät im Browser gespeichert.
