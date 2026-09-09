import { useEffect, useState } from 'react'
import { classifyTickets, exportCsv, fetchTickets } from './api'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'
import SkippedBanner from './components/SkippedBanner'

export default function App() {
  const [tickets, setTickets] = useState([])
  const [skipped, setSkipped] = useState([])
  const [filter, setFilter] = useState('all')
  const [loadError, setLoadError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    let isMounted = true
    fetchTickets()
      .then((data) => {
        if (isMounted) setTickets(data)
      })
      .catch((err) => {
        if (isMounted) setLoadError(err.message)
      })
    return () => {
      isMounted = false
    }
  }, [])

  async function handleClassify(ticketsPayload) {
    const response = await classifyTickets(ticketsPayload)
    setTickets(response.tickets)
    setSkipped(response.skipped || [])
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      await exportCsv()
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-6">
        {loadError && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        <SkippedBanner skipped={skipped} onDismiss={() => setSkipped([])} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <InputPanel onClassify={handleClassify} />
          <ResultsPanel
            tickets={tickets}
            filter={filter}
            onFilterChange={setFilter}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </div>
      </main>
    </div>
  )
}
