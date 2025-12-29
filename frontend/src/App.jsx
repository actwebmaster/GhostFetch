import { useState } from 'react'
import { Globe, Zap, Download, Copy, Check, Loader2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import './index.css'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const handleScrape = async () => {
    if (!url) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post('http://localhost:8000/scrape', {
        url: url,
        output_format: 'markdown'
      })

      if (response.data.success) {
        setResult(response.data)
      } else {
        setError('Scraping war nicht erfolgreich.')
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Fehler beim Verbinden zum Server.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!result?.content) return

    const blob = new Blob([result.content], { type: 'text/markdown' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `scrape_result_${new Date().getTime()}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-16 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text">Scrapecon</h1>
        </div>
        <p className="text-slate-400 text-lg">
          Webinhalte in sauberes Markdown konvertieren. Schnell. Zuverlässig. Stealth.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        {/* Input Section */}
        <div className="glass rounded-2xl p-8 mb-8 animate-slide-up">
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com eingeben..."
              className="flex-1 px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-xl 
                       text-slate-100 placeholder-slate-500 outline-none 
                       focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 
                       transition-all duration-300"
              onKeyPress={(e) => e.key === 'Enter' && handleScrape()}
            />
            <button
              onClick={handleScrape}
              disabled={loading || !url}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 
                       hover:from-cyan-600 hover:to-blue-700 
                       disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed
                       rounded-xl font-semibold text-white 
                       shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                       transition-all duration-300 flex items-center gap-2
                       transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Scrape
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="glass rounded-2xl p-8 animate-slide-up">
            {/* Result Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-1">Ergebnis</h2>
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                  <p className="truncate max-w-md">{result.url}</p>
                  {result.metadata && (
                    <>
                      <span>•</span>
                      <span>{result.metadata.links_count} Links</span>
                      <span>•</span>
                      <span>{result.metadata.media_count} Bilder</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 glass glass-hover rounded-lg 
                           flex items-center gap-2 text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Kopieren
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 glass glass-hover rounded-lg 
                           flex items-center gap-2 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            {/* Result Content */}
            <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800 custom-scrollbar overflow-auto max-h-[500px]">
              <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap">
                {result.content}
              </pre>
            </div>
          </div>
        )}

        {/* Features Grid */}
        {!result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: Zap,
                title: 'Blitzschnell',
                description: 'Ergebnisse in unter 5 Sekunden für die meisten Websites'
              },
              {
                icon: Globe,
                title: 'Stealth Mode',
                description: 'Umgehung von Anti-Bot-Maßnahmen für zuverlässige Scrapes'
              },
              {
                icon: Download,
                title: 'Flexible Formate',
                description: 'Export als Markdown, JSON oder Plain Text'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="glass glass-hover rounded-xl p-6 animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <feature.icon className="w-10 h-10 text-cyan-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-16 text-center text-slate-500 text-sm">
        Scrapecon v1.0 • Made with ❤️ for Developers
      </footer>
    </div>
  )
}

export default App
