import { useState } from 'react'
import { deleteTicket } from '../api'
import { CATEGORY_STYLES, urgencyStyles } from '../constants'

function formatTimestamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function TicketCard({ ticket, onDeleted }) {
  const { text, source, created_at: createdAt, category, urgency_score: urgencyScore } = ticket
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteTicket(ticket.id)
      onDeleted(ticket.id)
    } catch (err) {
      setDeleteError(err.message)
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="Delete ticket"
        className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        &times;
      </button>
      <div className="mb-2 flex flex-wrap items-center gap-2 pr-6">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyStyles(urgencyScore)}`}
        >
          {urgencyScore != null ? `Urgency ${urgencyScore}` : 'Unclassified'}
        </span>
        {category && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
              CATEGORY_STYLES[category] ?? 'bg-gray-100 text-gray-800'
            }`}
          >
            {category}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-900">{text}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <span className="capitalize">{source}</span>
        <span>&middot;</span>
        <span>{formatTimestamp(createdAt)}</span>
      </div>
      {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
    </div>
  )
}
