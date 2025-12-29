# Product Requirements Document (PRD): GhostFetch
**Version:** 1.0  
**Datum:** 29.12.2025  
**Status:** Draft
## 1. Executive Summary
**GhostFetch** ist eine eigenständige Scraping-Anwendung, die Webinhalte (Blogs, Dokumentationen, Notion-Seiten) in sauberes Markdown oder JSON konvertiert. Die App kombiniert moderne Stealth-Crawler-Technologie mit einer benutzerfreundlichen Oberfläche.
**Vision:** Das beste Tool für Developer und Content-Teams, um Web-Inhalte schnell und zuverlässig zu extrahieren.
## 2. Core Features
### 2.1. Single Page Scrape
- URL eingeben → Markdown/JSON Ergebnis in Sekunden.
- **Stealth Mode:** Umgehung gängiger Anti-Bot-Maßnahmen.
### 2.2. Deep Crawl
- Ganze Domains crawlen mit einstellbarer Tiefe.
- Fortschrittsanzeige in Echtzeit.
### 2.3. Output Management
- **Preview:** Gerenderte Vorschau vs. Rohdaten (Split View).
- **Export:** Download als [.md](cci:7://file:///Users/hueseyin/.gemini/antigravity/brain/a1ba928e-0d5f-4ea7-9980-cd9c7cfd5a43/task.md:0:0-0:0), [.json](cci:7://file:///Users/hueseyin/Downloads/devprj/aiprj-cld/Apps/googleadsassist/backend/knowledge/sources.json:0:0-0:0), oder `.txt`.
- **Clipboard:** One-Click Copy.
### 2.4. Source Management
- Gespeicherte URL-Listen für wiederkehrende Scrapes.
- Automatische Deduplizierung.
## 3. Technical Architecture
### Stack
- **Backend:** Python FastAPI, Crawl4AI, Playwright.
- **Frontend:** Vite + React, TailwindCSS, Lucide Icons.
- **Datenbank:** SQLite (für Job-Queue und History).
### API Endpoints
| Endpoint | Method | Beschreibung |
|---|---|---|
| `/scrape` | POST | Scrapt eine einzelne URL |
| `/crawl` | POST | Startet einen Deep Crawl |
| `/status/{job_id}` | GET | Status eines laufenden Jobs |
| `/history` | GET | Liste vergangener Scrapes |
## 4. UI Design Principles
- **Premium Ästhetik:** Dunkler Modus, subtile Animationen, Glassmorphism.
- **Fokus auf Funktion:** Große zentrale Searchbar, klare Ergebnisdarstellung.
- **Responsiv:** Desktop-first, aber mobil nutzbar.
## 5. Roadmap
### Phase 1: MVP
- [x] Projekt-Setup (Backend + Frontend)
- [x] Basic UI mit URL-Input und Ergebnisanzeige
- [x] Single Page Scrape Endpoint (Integration mit Crawl4AI)
### Phase 2: Enhancement
- [ ] Deep Crawl mit Fortschrittsanzeige
- [ ] History und Job-Management
- [ ] Export-Optionen (MD, JSON, TXT)
### Phase 3: Polish
- [ ] Stealth Mode Optimierung
- [ ] Rate Limiting und Queue Management
- [ ] User Settings (Dark/Light Mode, Output Format Defaults)
## 6. Success Metrics
- **Scrape-Erfolgsrate:** >95% für Standard-Websites.
- **Performance:** <5 Sekunden für Single Page Scrape.
- **User Experience:** Intuitive Bedienung ohne Dokumentation.
