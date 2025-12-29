
import sqlite3
from datetime import datetime
import json
from contextlib import contextmanager

DB_NAME = "ghostfetch.db"

def init_db():
    """Initialisiert die Datenbank und erstellt die Tabellen."""
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        
        # Jobs Tabelle
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            status TEXT NOT NULL,
            max_depth INTEGER,
            pages_scraped INTEGER DEFAULT 0,
            total_pages_found INTEGER DEFAULT 0,
            result_summary TEXT,  -- JSON string with summary stats
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Pages Tabelle (für die Ergebnisse des Crawls)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            url TEXT NOT NULL,
            content TEXT,       -- Markdown content
            html_content TEXT,  -- Cleaned HTML content
            metadata TEXT,      -- JSON string
            is_successful BOOLEAN DEFAULT 0,
            crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(job_id) REFERENCES jobs(id)
        )
        """)
        
        # Settings Tabelle
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        """)
        
        # Default Settings initieren falls nicht vorhanden
        defaults = {
            "crawl_delay": "1.0",
            "default_format": "markdown",
            "theme_accent": "cyan"
        }
        for k, v in defaults.items():
            cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))
            
        conn.commit()

@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    try:
        conn.row_factory = sqlite3.Row
        yield conn
    finally:
        conn.close()

def get_settings():
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT * FROM settings")
        return {row['key']: row['value'] for row in cursor.fetchall()}

def update_setting(key: str, value: str):
    with get_db_connection() as conn:
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
        conn.commit()


def create_job(job_id: str, url: str, max_depth: int):
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO jobs (id, url, status, max_depth, pages_scraped, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (job_id, url, 'pending', max_depth, 0, datetime.now(), datetime.now())
        )
        conn.commit()

def update_job_status(job_id: str, status: str, pages_scraped: int = None, total_pages_found: int = None):
    with get_db_connection() as conn:
        updates = ["status = ?", "updated_at = ?"]
        params = [status, datetime.now()]
        
        if pages_scraped is not None:
            updates.append("pages_scraped = ?")
            params.append(pages_scraped)
            
        if total_pages_found is not None:
            updates.append("total_pages_found = ?")
            params.append(total_pages_found)
            
        params.append(job_id)
        
        query = f"UPDATE jobs SET {', '.join(updates)} WHERE id = ?"
        conn.execute(query, params)
        conn.commit()

def get_job(job_id: str):
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None

def add_page(job_id: str, url: str, content: str, html_content: str, metadata: dict, is_successful: bool):
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO pages (job_id, url, content, html_content, metadata, is_successful, crawled_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (job_id, url, content, html_content, json.dumps(metadata), is_successful, datetime.now())
        )
        conn.commit()

def get_job_pages(job_id: str):
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT * FROM pages WHERE job_id = ?", (job_id,))
        return [dict(row) for row in cursor.fetchall()]

def get_all_jobs(limit: int = 20):
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?", (limit,))
        return [dict(row) for row in cursor.fetchall()]
