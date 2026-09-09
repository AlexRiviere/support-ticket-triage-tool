import { CATEGORY_STYLES, urgencyStyles } from '../constants'

function formatTimestamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function TicketCard({ ticket }) {
  const { text, source, created_at: createdAt, category, urgency_score: urgencyScore } = ticket

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
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
    </div>
  )
}
