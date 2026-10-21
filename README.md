# Healtheye — IT-Security News Dashboard

Eigenständiges Security-News-Dashboard in einer einzigen HTML-Datei. Keine Dependencies, kein Build, kein Backend.

**Live:** `https://<dein-username>.github.io/<repo-name>/` (nach dem ersten Push)

## Was es tut

- Zieht Security-News automatisch aus RSS/Atom-Feeds (heise Security, The Hacker News, BleepingComputer, Krebs on Security, SecurityWeek, CISA Advisories) — alle 10 Min.
- Zeigt **CISA KEV** (aktiv ausgenützte Schwachstellen, inkl. Ransomware-Flag)
- Markiert **Healthcare-/Spital-relevante** Meldungen und Schweregrade (kritisch/hoch/mittel/info)
- Filter, Volltextsuche, News-Ticker, Live-Uhr (Europe/Zurich)
- localStorage-Cache → zeigt sofort Inhalt, auch wenn ein Proxy hängt

## Lokal starten

Einfach `index.html` im Browser öffnen. Kiosk/SOC-Bildschirm:

```bash
chrome --kiosk "https://<dein-username>.github.io/<repo-name>/"
# oder lokal:
firefox --kiosk "file:///pfad/index.html"
```

## Anpassen

Alles in `index.html` oben im `<script>`-Block, Sektion **KONFIGURATION**:

| Was | Wo |
|---|---|
| Feed-Quellen | `FEEDS` |
| Healthcare-Keywords (Hersteller etc.) | `HEALTH` |
| Schweregrad-Keywords | `CRIT`, `MED` |
| Refresh-Intervall | `REFRESH_MIN` |
| CORS-Proxies / eigener Intranet-Proxy | `PROXIES` |

## Hinweis CORS-Proxies

Browser blockieren direkte RSS-Abrufe von Fremddomains. Das Board nutzt öffentliche CORS-Proxies mit Fallback. Es fliessen **keine internen Daten** — nur öffentliche Feed-URLs. Falls die Policy Dritt-Proxies verbietet: eigenen Mini-Proxy ins Intranet stellen und in `PROXIES` vorne eintragen.

## GitHub Pages aktivieren

Nach dem ersten Push: **Settings → Pages → Build and deployment → Source: „GitHub Actions"**. Der Workflow deployt bei jedem Push auf `main` automatisch.

## Quellen & Haftung

Datenquellen: RSS/Atom-Feeds der jeweiligen Anbieter & CISA KEV. Inhalte © der jeweiligen Quelle. Keine Gewähr.
