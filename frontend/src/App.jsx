import { useEffect, useState } from 'react'
import { classifyTickets, exportCsv, fetchTickets } from './api'
import DraftsSection from './components/DraftsSection'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'

function makeDraftId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function draftsFromResponse(response) {
  const skippedDrafts = (response.skipped || []).map((item) => ({
    id: makeDraftId(),
    text: item.text,
    originalText: item.text,
    kind: 'skipped',
    reason: item.reason,
    mode: 'edit',
  }))
  const failedDrafts = (response.failed || []).map((item) => ({
    id: makeDraftId(),
    text: item.text,
    originalText: item.text,
    kind: 'failed',
    reason: item.reason,
    mode: 'view',
  }))
  return [...skippedDrafts, ...failedDrafts]
}

export default function App() {
  const [tickets, setTickets] = useState([])
  const [drafts, setDrafts] = useState([])
  const [retryingIds, setRetryingIds] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const [source, setSource] = useState('manual')
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
    setDrafts((prev) => [...prev, ...draftsFromResponse(response)])
  }

  function handleEditDraft(id) {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, mode: 'edit' } : draft)))
  }

  function handleCancelDraft(id) {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id ? { ...draft, text: draft.originalText, mode: 'view' } : draft,
      ),
    )
  }

  function handleDraftTextChange(id, text) {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, text } : draft)))
  }

  async function handleRetryDraft(draft) {
    setRetryingIds((prev) => new Set(prev).add(draft.id))
    try {
      const response = await classifyTickets([{ text: draft.text, source }])
      setTickets(response.tickets)

      const failedItem = response.failed?.[0]
      const skippedItem = response.skipped?.[0]

      if (!failedItem && !skippedItem) {
        setDrafts((prev) => prev.filter((item) => item.id !== draft.id))
        return
      }

      const outcome = failedItem || skippedItem
      const kind = failedItem ? 'failed' : 'skipped'
      setDrafts((prev) =>
        prev.map((item) =>
          item.id === draft.id
            ? {
                ...item,
                text: outcome.text,
                originalText: outcome.text,
                reason: outcome.reason,
                kind,
                mode: kind === 'skipped' ? 'edit' : 'view',
              }
            : item,
        ),
      )
    } catch (err) {
      setDrafts((prev) =>
        prev.map((item) =>
          item.id === draft.id ? { ...item, reason: err.message, kind: 'failed', mode: 'view' } : item,
        ),
      )
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev)
        next.delete(draft.id)
        return next
      })
    }
  }

  function handleDeleteTicket(id) {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id))
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <div>
            <InputPanel onClassify={handleClassify} source={source} onSourceChange={setSource} />
            <DraftsSection
              drafts={drafts}
              retryingIds={retryingIds}
              onEdit={handleEditDraft}
              onCancel={handleCancelDraft}
              onTextChange={handleDraftTextChange}
              onRetry={handleRetryDraft}
            />
          </div>
          <ResultsPanel
            tickets={tickets}
            filter={filter}
            onFilterChange={setFilter}
            onExport={handleExport}
            isExporting={isExporting}
            onDeleteTicket={handleDeleteTicket}
          />
        </div>
      </main>
    </div>
  )
}
