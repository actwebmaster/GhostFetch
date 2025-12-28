# 🌐 Scrapecon

**Die ultimative Web-Scraping-Lösung für Developers**

Scrapecon konvertiert Webinhalte (Blogs, Docs, Notion-Seiten) in sauberes Markdown oder JSON. Mit Stealth-Technologie und Premium UI.

## ✨ Features

- 🚀 **Blitzschnell:** Ergebnisse in unter 5 Sekunden
- 🥷 **Stealth Mode:** Umgeht Anti-Bot-Maßnahmen
- 📦 **Flexible Exports:** Markdown, JSON oder Plain Text
- 🎨 **Premium UI:** Dark Mode mit Glassmorphism
- 🔄 **Deep Crawl:** Ganze Domains crawlen (Coming Soon)

## 🛠️ Tech Stack

### Backend
- Python FastAPI
- Crawl4AI (Advanced Web Crawler)
- Playwright (Browser Automation)
- SQLite (Job Queue & History)

### Frontend
- Vite + React
- TailwindCSS (Custom Design System)
- Lucide Icons
- Axios (API Communication)

## 🚀 Quick Start

### Backend

```bash
cd backend

# Python Virtual Environment erstellen
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# oder: venv\Scripts\activate  # Windows

# Dependencies installieren
pip install -r requirements.txt

# Playwright Browser installieren
playwright install chromium

# Server starten
python main.py
```

Backend läuft auf: `http://localhost:8000`

### Frontend

```bash
cd frontend

# Dependencies installieren (falls noch nicht geschehen)
npm install

# Dev Server starten
npm run dev
```

Frontend läuft auf: `http://localhost:5173`

## 📡 API Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/` | GET | Health Check |
| `/scrape` | POST | Scrapt einzelne URL |
| `/crawl` | POST | Deep Crawl starten |
| `/status/{job_id}` | GET | Job-Status abfragen |
| `/history` | GET | Scrape-Historie |

### Beispiel API Call

```bash
curl -X POST http://localhost:8000/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "output_format": "markdown"
  }'
```

## 📋 Roadmap

### Phase 1: MVP ✅
- [x] Backend + Frontend Setup
- [ ] Single Page Scrape Endpoint
- [ ] Basic UI mit URL Input

### Phase 2: Enhancement
- [ ] Deep Crawl mit Progress
- [ ] History & Job Management
- [ ] Export-Optionen (MD, JSON, TXT)

### Phase 3: Polish
- [ ] Stealth Mode Optimierung
- [ ] Rate Limiting
- [ ] User Settings (Theme, Defaults)

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

**Made with ❤️ for the Developer Community**
