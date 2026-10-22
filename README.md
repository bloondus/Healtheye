# Healtheye — IT-Security News Dashboard

Eigenständiges Security-News-Dashboard als **eine GitHub Page**. Kein Backend, keine Datenbank, keine Dependencies — nur statische Dateien plus eine GitHub Action, die die News serverseitig holt.

**Live:** https://bloondus.github.io/Healtheye/

## Was es tut

- **8 Quellen** automatisch, alle 30 Min frisch: heise Security, The Hacker News, BleepingComputer, Krebs on Security, SecurityWeek, CISA Advisories, HIPAA Journal, HealthcareInfoSec
- **🚦 Bedrohungs-Ampel** (ROT/GELB/GRÜN) im Header — berechnet aus überfälligen KEVs, kritischen Healthcare-News der letzten 24h und Feed-Health
- **⚠ CISA KEV** — aktiv ausgenützte Schwachstellen, sortiert nach Frist, mit ⏰/⚠-Highlight und 🔥 Ransomware-Flag
- **🏥 Healthcare-Filter** — erkennt Spital-/Medizin-relevante Meldungen (Hersteller, KIS/RIS/PACS, Ransomware-Gruppen, Regulierung)
- **🧠 Smart-Sort** — Healthcare + kritisch zuerst, gelesene sinken ab
- **🔵 Neu-Delta** — „+X neu seit letztem Besuch", lokal im Browser
- **✓ Als gelesen markieren** — Karten ausgrauen, lokal gespeichert
- Filter, Volltextsuche, News-Ticker, Live-Uhr (Europe/Zurich)

## Wie es funktioniert (Architektur)

```
GitHub Action (alle 30 Min, cron)
  └─ fetch-feeds.mjs  → holt RSS/KEV serverseitig (kein CORS), klassifiziert
       └─ schreibt data.json
            └─ GitHub Pages deployt index.html + data.json
                 └─ Browser lädt data.json von gleicher Origin (kein Proxy nötig)
```

Die Proxies in `PROXIES` sind nur noch **Fallback** für den Fall, dass jemand die Seite lokal per `file://` ohne `data.json` öffnet.

## Lokal starten

```bash
# 1) Daten holen (erzeugt data.json)
node fetch-feeds.mjs

# 2) Seite öffnen
firefox index.html          # oder Doppelklick

# Kiosk/SOC-Bildschirm
chrome --kiosk "https://bloondus.github.io/Healtheye/"
```

## Anpassen

Alles in [index.html](index.html) oben im `<script>`-Block, Sektion **KONFIGURATION**:

| Was | Wo |
|---|---|
| Feed-Quellen | `FEEDS` |
| Healthcare-Keywords | `HEALTH` |
| Schweregrad-Keywords | `CRIT`, `MED` |
| Refresh-Intervall (Browser) | `REFRESH_MIN` |
| CORS-Fallback-Proxies | `PROXIES` |

⚠️ **Wichtig:** `FEEDS` und die Keyword-Listen müssen zusätzlich in [fetch-feeds.mjs](fetch-feeds.mjs) gepflegt werden (serverseitig). Beide Stellen synchron halten.

## Eigene Systeme („🎯 BETRIFFT UNS"-Badge)

Die Liste eurer Infrastruktur liegt **nicht im Repo** (Datenschutz). So richtet ihr sie ein:

```bash
cp assets.local.example.js assets.local.js
# → assets.local.js an eure echten Systeme anpassen (alles kleingeschrieben)
```

`assets.local.js` steht in `.gitignore` und wird **nie committed**. Ohne die Datei zeigt das Board einfach kein Badge — kein Fehler. So bleibt euer Tech-Stack privat, auch im öffentlichen Repo.

## Sicherheit (Härtung)

- **Content-Security-Policy** im `<head>` — blockt fremde Quellen, `object`, `base-uri`-Missbrauch
- **`safeUrl()`** — lässt nur `http(s)`-Links durch; `javascript:`/`data:`/`vbscript:` aus einem kompromittierten Feed werden blockiert
- **Feed-Texte** werden strikt escaped (kein HTML aus Feeds ins DOM)
- **Keine Secrets, keine Nutzerdaten, kein Tracking** — die Seite ist read-only

## GitHub Pages aktivieren

**Settings → Pages → Build and deployment → Source: „GitHub Actions"** — der Workflow deployt bei jedem Push auf `main` und alle 30 Min per Cron automatisch frische Daten.

## Quellen & Haftung

Datenquellen: RSS/Atom-Feeds der jeweiligen Anbieter & CISA KEV. Inhalte © der jeweiligen Quelle. Keine Gewähr.
