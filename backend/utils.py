import re
from typing import Optional

def clean_markdown(content: str) -> str:
    """
    Bereinigt den generierten Markdown-Content von unnötigem Whitespace
    und Artefakten.
    """
    if not content:
        return ""
    
    # Entferne mehrfache Leerzeilen (mehr als 2)
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Entferne Trailing Whitespace pro Zeile
    content = "\n".join([line.rstrip() for line in content.splitlines()])
    
    return content.strip()

def extract_metadata(result: object) -> dict:
    """
    Extrahiert nützliche Metadaten aus dem Crawl-Ergebnis.
    """
    # Dies ist ein Platzhalter, muss an das tatsächliche Crawl4AI Result-Objekt angepasst werden
    # wenn wir die genaue Struktur zur Laufzeit sehen.
    return {
        "title": getattr(result, "title", "No Title"),
        "description": getattr(result, "description", ""),
        "keywords": getattr(result, "keywords", ""),
    }
