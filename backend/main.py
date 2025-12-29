
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import uvicorn
import uuid
import asyncio
from crawl4ai import AsyncWebCrawler
from utils import clean_markdown

# Database & Crawler Service
from database import init_db, create_job, get_job, get_all_jobs, get_job_pages, get_settings, update_setting
from crawler_service import process_crawl_job

app = FastAPI(
    title="GhostFetch API",
    description="Web Scraping API mit Stealth Mode",
    version="1.0.0"
)

# Initialize Database on Startup
@app.on_event("startup")
def on_startup():
    init_db()

# CORS Middleware für Frontend-Kommunikation
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ScrapeRequest(BaseModel):
    url: HttpUrl
    output_format: Optional[str] = "markdown"  # markdown, json, text

class CrawlRequest(BaseModel):
    url: HttpUrl
    max_depth: Optional[int] = 2
    output_format: Optional[str] = "markdown"

class SettingsRequest(BaseModel):
    crawl_delay: Optional[float] = None
    default_format: Optional[str] = None
    theme_accent: Optional[str] = None

# Response Models
class ScrapeResponse(BaseModel):
    success: bool
    url: str
    content: str
    format: str
    metadata: Optional[dict] = None

@app.get("/")
async def root():
    """Health Check"""
    return {
        "status": "online",
        "service": "GhostFetch API",
        "version": "1.0.0"
    }

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_url(request: ScrapeRequest):
    """
    Scrapt eine einzelne URL mit Crawl4AI uns gibt den Inhalt zurück
    """
    url_str = str(request.url)
    print(f"Starting scrape for: {url_str}")
    
    try:
        async with AsyncWebCrawler(verbose=True) as crawler:
            result = await crawler.arun(url=url_str)
            
            if not result.markdown:
                 raise HTTPException(status_code=500, detail="Kein Content gefunden oder Scraping fehlgeschlagen.")

            cleaned_content = clean_markdown(result.markdown)
            
            # Einfache Metadaten
            metadata = {
                "scraped_at": "now", # Placeholder
                "media_count": len(result.media) if hasattr(result, 'media') else 0,
                "links_count": len(result.links) if hasattr(result, 'links') else 0
            }

            return ScrapeResponse(
                success=True,
                url=url_str,
                content=cleaned_content,
                format=request.output_format,
                metadata=metadata
            )
            
    except Exception as e:
        print(f"Error scraping {url_str}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/crawl")
async def crawl_domain(request: CrawlRequest, background_tasks: BackgroundTasks):
    """
    Startet einen Deep Crawl für eine Domain im Hintergrund
    """
    job_id = str(uuid.uuid4())
    url_str = str(request.url)
    
    # 1. Job in DB erstellen
    create_job(job_id, url_str, request.max_depth)
    
    # 2. Background Task starten
    background_tasks.add_task(process_crawl_job, job_id, url_str, request.max_depth)
    
    return {
        "job_id": job_id,
        "status": "started",
        "url": url_str,
        "max_depth": request.max_depth
    }

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Gibt den Status eines laufenden Crawl-Jobs zurück
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "job_id": job['id'],
        "status": job['status'],
        "pages_scraped": job['pages_scraped'],
        "total_pages_found": job['total_pages_found'],
        "created_at": job['created_at']
    }

@app.get("/job/{job_id}/results")
async def get_job_results(job_id: str):
    """
    Gibt die Ergebnisse (Seiten) eines Jobs zurück
    """
    pages = get_job_pages(job_id)
    return {
        "job_id": job_id,
        "count": len(pages),
        "pages": pages
    }

@app.get("/history")
async def get_history():
    """
    Liste aller vergangenen Scrape-Operationen (Jobs)
    """
    jobs = get_all_jobs()
    return {
        "total": len(jobs),
        "items": jobs
    }

@app.get("/settings")
async def get_app_settings():
    """
    Ruft die aktuellen Einstellungen ab
    """
    return get_settings()

@app.post("/settings")
async def update_app_settings(settings: SettingsRequest):
    """
    Aktualisiert die Einstellungen
    """
    if settings.crawl_delay is not None:
        update_setting("crawl_delay", str(settings.crawl_delay))
    if settings.default_format is not None:
        update_setting("default_format", settings.default_format)
    if settings.theme_accent is not None:
        update_setting("theme_accent", settings.theme_accent)
    
    return get_settings()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
