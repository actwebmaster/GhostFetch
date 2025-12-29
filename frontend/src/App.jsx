
import { useState, useEffect } from 'react'
import { Globe, Zap, Download, Copy, Check, Loader2, AlertCircle, Layers, Search, Settings } from 'lucide-react'
import axios from 'axios'
import './index.css'
import CrawlResults from './components/CrawlResults'
import SettingsModal from './settings/Settings'

function App() {
  // Global State
  const [mode, setMode] = useState('single') // 'single' | 'deep'
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // Single Scrape State
  const [singleResult, setSingleResult] = useState(null)
  const [copied, setCopied] = useState(false)

  // Deep Crawl State
  const [depth, setDepth] = useState(2)
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null) // { status, pages_scraped, total_pages_found }
  const [crawlResults, setCrawlResults] = useState(null)

  // Polling Effect for Deep Crawl
  useEffect(() => {
    let intervalId;

    if (jobId && jobStatus?.status === 'running') {
      intervalId = setInterval(async () => {
        try {
          const res = await axios.get(`http://localhost:8000/status/${jobId}`);
          setJobStatus(res.data);

          if (res.data.status === 'completed') {
            clearInterval(intervalId);
            fetchCrawlResults(jobId);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, jobStatus?.status]);

  const fetchCrawlResults = async (id) => {
    try {
      const res = await axios.get(`http://localhost:8000/job/${id}/results`);
      setCrawlResults(res.data.pages);
      setLoading(false);
    } catch (err) {
      setError('Fehler beim Laden der Ergebnisse.');
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    if (!url) return
    setError(null)
    setLoading(true)

    if (mode === 'single') {
      setSingleResult(null)
      try {
        const response = await axios.post('http://localhost:8000/scrape', {
          url: url,
          output_format: 'markdown'
        })
        if (response.data.success) {
          setSingleResult(response.data)
        } else {
          setError('Scraping war nicht erfolgreich.')
        }
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.detail || 'Fehler beim Verbinden zum Server.')
      } finally {
        setLoading(false)
      }
    } else {
      // Deep Crawl Start
      setCrawlResults(null)
      setJobStatus(null)
      try {
        const response = await axios.post('http://localhost:8000/crawl', {
          url: url,
          max_depth: parseInt(depth),
          output_format: 'markdown'
        })
        setJobId(response.data.job_id)
        setJobStatus({ status: 'running', pages_scraped: 0, total_pages_found: 0 })
        // Loading stays true until crawl is finished
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.detail || 'Fehler beim Starten des Crawls.')
        setLoading(false)
      }
    }
  }

  const handleCopy = () => {
    if (singleResult?.content) {
      navigator.clipboard.writeText(singleResult.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadSingle = () => {
    if (!singleResult?.content) return
    const blob = new Blob([singleResult.content], { type: 'text/markdown' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `scrape_result_${new Date().getTime()}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen p-8">
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">GhostFetch</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Dein Interface für das Internet. Stealth Scraping & Deep Crawling.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex gap-4 items-center">
          {/* Mode Switcher */}
          <div className="bg-slate-900/50 p-1 rounded-xl flex gap-1 border border-slate-700/50">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                        ${mode === 'single' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Zap className="w-4 h-4" /> Single Page
            </button>
            <button
              onClick={() => setMode('deep')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                        ${mode === 'deep' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" /> Deep Crawl
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Einstellungen"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        {/* Input Section */}
        <div className="glass rounded-2xl p-8 mb-8 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={mode === 'single' ? "https://example.com/article" : "https://docs.example.com (Domain root)"}
                className="w-full pl-12 pr-6 py-4 bg-slate-900/50 border border-slate-700 rounded-xl 
                        text-slate-100 placeholder-slate-500 outline-none 
                        focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 
                        transition-all duration-300"
                onKeyPress={(e) => e.key === 'Enter' && handleScrape()}
              />
            </div>

            {mode === 'deep' && (
              <div className="md:w-32">
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  placeholder="Tiefe"
                  title="Crawling Tiefe"
                  className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl 
                                text-slate-100 outline-none focus:border-cyan-500 text-center"
                />
              </div>
            )}

            <button
              onClick={handleScrape}
              disabled={loading || !url || (mode === 'deep' && jobStatus?.status === 'running')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 
                       hover:from-cyan-600 hover:to-blue-700 
                       disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed
                       rounded-xl font-semibold text-white 
                       shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                       transition-all duration-300 flex items-center gap-2
                       transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              {loading && mode === 'single' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scraping...
                </>
              ) : loading && mode === 'deep' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {jobStatus ? 'Crawling...' : 'Starting...'}
                </>
              ) : (
                <>
                  {mode === 'single' ? <Zap className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                  {mode === 'single' ? 'Fetch Page' : 'Start Crawl'}
                </>
              )}
            </button>
          </div>

          {/* Deep Crawl Progress Bar */}
          {mode === 'deep' && jobStatus && jobStatus.status === 'running' && (
            <div className="mt-6 animate-fade-in">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Status: {jobStatus.status}</span>
                <span>{jobStatus.pages_scraped} Seiten gefunden</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 animate-pulse"
                  style={{ width: '100%' }} // Infinite loading bar usually better for unknown totals
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="min-h-[200px]">
          {/* Single Scrape Result */}
          {mode === 'single' && singleResult && (
            <div className="glass rounded-2xl p-8 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100 mb-1">Ergebnis</h2>
                  <div className="flex items-center gap-4 text-slate-400 text-sm">
                    <p className="truncate max-w-md">{singleResult.url}</p>
                    {singleResult.metadata && (
                      <>
                        <span>•</span>
                        <span>{singleResult.metadata.links_count} Links</span>
                        <span>•</span>
                        <span>{singleResult.metadata.media_count} Bilder</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 glass glass-hover rounded-lg flex items-center gap-2 text-sm font-medium"
                  >
                    {copied ? <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Kopiert!</span></> : <><Copy className="w-4 h-4" /> Kopieren</>}
                  </button>
                  <button
                    onClick={handleDownloadSingle}
                    className="px-4 py-2 glass glass-hover rounded-lg flex items-center gap-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800 custom-scrollbar overflow-auto max-h-[500px]">
                <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap">
                  {singleResult.content}
                </pre>
              </div>
            </div>
          )}

          {/* Deep Crawl Result */}
          {mode === 'deep' && crawlResults && (
            <CrawlResults results={crawlResults} jobStatus={jobStatus} />
          )}

          {/* Empty State / Features */}
          {!singleResult && !crawlResults && !loading && !jobStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80 mt-12">
              <div className="glass p-6 rounded-xl flex flex-col items-center text-center">
                <Zap className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="font-semibold text-slate-200">Blitzschnell</h3>
                <p className="text-sm text-slate-500">Konvertiert Webseiten in Sekunden in Markdown.</p>
              </div>
              <div className="glass p-6 rounded-xl flex flex-col items-center text-center">
                <Layers className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="font-semibold text-slate-200">Deep Crawl</h3>
                <p className="text-sm text-slate-500">Folgt Links automatisch und archiviert ganze Bereiche.</p>
              </div>
              <div className="glass p-6 rounded-xl flex flex-col items-center text-center">
                <Download className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="font-semibold text-slate-200">LLM Ready</h3>
                <p className="text-sm text-slate-500">Exportiere als JSONL oder XML für dein KI-Training.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-16 text-center text-slate-500 text-sm border-t border-slate-800/50 pt-8">
        GhostFetch v1.1 • Made with ❤️ for Developers
      </footer>
    </div>
  )
}

export default App
