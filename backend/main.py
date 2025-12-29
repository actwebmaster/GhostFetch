from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import uvicorn
import asyncio
from crawl4ai import AsyncWebCrawler
from utils import clean_markdown

app = FastAPI(
    title="GhostFetch API",
    description="Web Scraping API mit Stealth Mode",
    version="1.0.0"
)

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
async def crawl_domain(request: CrawlRequest):
    """
    Startet einen Deep Crawl für eine Domain (Placeholder)
    """
    # TODO: Implementierung mit Crawl4AI + Job Queue
    return {
        "job_id": "placeholder-123",
        "status": "started",
        "url": str(request.url),
        "max_depth": request.max_depth
    }

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Gibt den Status eines laufenden Crawl-Jobs zurück
    """
    # TODO: Job-Status aus DB abrufen
    return {
        "job_id": job_id,
        "status": "running",
        "progress": 0,
        "pages_scraped": 0
    }

@app.get("/history")
async def get_history():
    """
    Liste aller vergangenen Scrape-Operationen
    """
    # TODO: Aus SQLite DB laden
    return {
        "total": 0,
        "items": []
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
