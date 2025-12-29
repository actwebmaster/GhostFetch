
import asyncio
from typing import Set, List
from urllib.parse import urlparse, urljoin
from crawl4ai import AsyncWebCrawler, BrowserConfig
from database import update_job_status, add_page, get_job, get_settings
from utils import clean_markdown
import logging

# Logger Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_crawl_job(job_id: str, start_url: str, max_depth: int):
    """
    Background Task die den Deep Crawl durchführt.
    """
    logger.info(f"Starting crawl job {job_id} for {start_url} with depth {max_depth}")
    
    update_job_status(job_id, "running")
    
    visited: Set[str] = set()
    queue: List[tuple[str, int]] = [(start_url, 0)] # (url, current_depth)
    pages_scraped_count = 0
    
    domain = urlparse(start_url).netloc
    
    # Crawler Instanz
    # Verwende verbose=False um Logs sauber zu halten
    browser_cfg = BrowserConfig(browser_type="chromium", headless=True, chrome_channel=None)
    async with AsyncWebCrawler(config=browser_cfg, verbose=True) as crawler:
        while queue:
            # Check for job cancellation (optional implementation)
            job = get_job(job_id)
            if job and job.get('status') == 'cancelled':
                logger.info(f"Job {job_id} cancelled")
                break

            current_url, depth = queue.pop(0)
            
            # Normalisierung der URL um Duplikate vermeiden
            if current_url in visited:
                continue
            
            visited.add(current_url)
            
            # Skip wenn max depth erreicht (aber scrap noch die Startseite wenn depth 0)
            if depth > max_depth:
                continue

            try:
                logger.info(f"Crawling: {current_url} (Depth: {depth})")
                
                # Fetch page
                result = await crawler.arun(url=current_url)
                
                if not result.markdown:
                    logger.warning(f"No content for {current_url}")
                    add_page(job_id, current_url, "", "", {}, False)
                    continue

                # Process content
                cleaned_content = clean_markdown(result.markdown)
                # Try to get cleaned HTML, fallback to raw HTML
                html_content = getattr(result, 'cleaned_html', None) or getattr(result, 'html', "")
                
                metadata = {
                    "depth": depth,
                    "media_count": len(result.media) if hasattr(result, 'media') else 0,
                    "links_count": len(result.links) if hasattr(result, 'links') else 0,
                    "title": "" # Title extraction could be added if available in result
                }
                
                # Save to DB
                add_page(job_id, current_url, cleaned_content, html_content, metadata, True)
                pages_scraped_count += 1
                update_job_status(job_id, "running", pages_scraped=pages_scraped_count, total_pages_found=len(queue) + len(visited))

                # Extract and queue links if not at max depth
                if depth < max_depth:
                    internal_links = result.links
                    # Crawl4AI liefert oft 'href'
                    if internal_links:
                        for key in internal_links.keys():
                            # Manche versionen liefern ein Dict, andere List.
                            # Falls DICT: key könnte die URL sein oder im Value stecken.
                            # Wir prüfen die Struktur. Crawl4AI 'result.links' ist oft ein Dictionary mit URLs als Keys.
                            # Oder eine Liste. Wir gehen sicher.
                            link_url = key # Annahme: Key ist URL.
                            if isinstance(internal_links, list):
                                # Fix falls es eine Liste ist (z.B. [{"href":...}, ...])
                                # Hier müsste man die Struktur genauer kennen. 
                                # Default Crawl4AI (neuere Versionen) hat oft {'url': ...} dicts
                                pass
                            
                            # Einfacher Check: Wir nehmen an result.links hat die URLs
                            # Wir filtern auf gleiche Domain
                            parsed_link = urlparse(link_url)
                            
                            # Filter: Nur gleiche Domain und http/https
                            if parsed_link.netloc == domain and parsed_link.scheme in ['http', 'https']:
                                if link_url not in visited:
                                    queue.append((link_url, depth + 1))
            
            except Exception as e:
                logger.error(f"Error processing {current_url}: {e}")
                add_page(job_id, current_url, "", "", {"error": str(e)}, False)

            # Rate Limiting Delay
            settings = get_settings()
            delay = float(settings.get("crawl_delay", 1.0))
            await asyncio.sleep(delay)

    update_job_status(job_id, "completed", pages_scraped=pages_scraped_count, total_pages_found=len(visited))
    logger.info(f"Job {job_id} finished")
