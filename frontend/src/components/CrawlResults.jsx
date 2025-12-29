
import React, { useState } from 'react';
import {
    FileText,
    Code,
    FileJson,
    Download,
    Check,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    FileCode
} from 'lucide-react';

const CrawlResults = ({ results, jobStatus }) => {
    const [expandedPage, setExpandedPage] = useState(null);

    if (!results || results.length === 0) {
        return (
            <div className="text-center text-slate-500 py-12">
                Keine Ergebnisse gefunden.
            </div>
        );
    }

    const successCount = results.filter(p => p.is_successful).length;

    const downloadFile = (content, filename, type) => {
        const blob = new Blob([content], { type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadMarkdown = () => {
        const content = results
            .filter(p => p.is_successful)
            .map(p => `# ${p.url}\n\n${p.content}`)
            .join('\n\n---\n\n');
        downloadFile(content, `crawl_export_${new Date().getTime()}.md`, 'text/markdown');
    };

    const handleDownloadJSONL = () => {
        const content = results
            .filter(p => p.is_successful)
            .map(p => JSON.stringify({
                url: p.url,
                content: p.content,
                metadata: JSON.parse(p.metadata || '{}')
            }))
            .join('\n');
        downloadFile(content, `crawl_export_${new Date().getTime()}.jsonl`, 'application/json');
    };

    const handleDownloadXML = () => {
        const content = `<?xml version="1.0" encoding="UTF-8"?>
<crawl_results>
  ${results.filter(p => p.is_successful).map(p => `
  <page>
    <url>${p.url}</url>
    <content><![CDATA[${p.content}]]></content>
  </page>`).join('')}
</crawl_results>`;
        downloadFile(content, `crawl_export_${new Date().getTime()}.xml`, 'application/xml');
    };

    const handleDownloadHTML = () => {
        const content = `<!DOCTYPE html>
<html>
<head><title>Crawl Export</title></head>
<body>
  ${results.filter(p => p.is_successful).map(p => `
  <article>
    <h1>Source: <a href="${p.url}">${p.url}</a></h1>
    <div class="content">
      ${p.html_content || '<!-- No HTML Content Available -->'}
    </div>
    <hr/>
  </article>`).join('')}
</body>
</html>`;
        downloadFile(content, `crawl_export_${new Date().getTime()}.html`, 'text/html');
    };

    return (
        <div className="animate-fade-in">
            {/* Summary Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Crawl Ergebnisse</h2>
                    <p className="text-slate-400 text-sm">
                        {successCount} von {results.length} Seiten erfolgreich geladen
                    </p>
                </div>

                {/* Export Actions */}
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleDownloadMarkdown} className="btn-secondary text-xs flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Markdown
                    </button>
                    <button onClick={handleDownloadJSONL} className="btn-secondary text-xs flex items-center gap-2">
                        <Code className="w-4 h-4" /> JSONL
                    </button>
                    <button onClick={handleDownloadXML} className="btn-secondary text-xs flex items-center gap-2">
                        <FileCode className="w-4 h-4" /> XML
                    </button>
                    <button onClick={handleDownloadHTML} className="btn-secondary text-xs flex items-center gap-2">
                        <FileCode className="w-4 h-4" /> HTML
                    </button>
                </div>
            </div>

            {/* Pages List */}
            <div className="space-y-3">
                {results.map((page, idx) => (
                    <div key={idx} className="glass rounded-xl overflow-hidden border border-slate-700/50">
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                            onClick={() => setExpandedPage(expandedPage === idx ? null : idx)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-2 h-2 rounded-full ${page.is_successful ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-slate-300 font-mono text-sm truncate">{page.url}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                                <span className="text-xs">{page.content?.length || 0} chars</span>
                                {expandedPage === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>

                        {/* Expanded Preview */}
                        {expandedPage === idx && (
                            <div className="p-4 bg-slate-950/30 border-t border-slate-800">
                                <div className="flex justify-end mb-2">
                                    <a
                                        href={page.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                    >
                                        Original öffnen <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar rounded-lg bg-slate-900/50 p-4">
                                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                                        {page.content || (page.is_successful ? '(Leerer Inhalt)' : 'Fehler beim Laden')}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CrawlResults;
