import { MAX_TEXT_LENGTH } from '../constants'

const KIND_BADGE = {
  failed: { label: 'Classification failed', className: 'bg-orange-100 text-orange-800' },
  skipped: { label: 'Too long', className: 'bg-red-100 text-red-800' },
}

function truncate(text, max = 100) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export default function DraftCard({ draft, isRetrying, onEdit, onCancel, onTextChange, onRetry }) {
  const badge = KIND_BADGE[draft.kind] ?? KIND_BADGE.failed

  if (draft.mode === 'edit') {
    const isOverLimit = draft.text.length > MAX_TEXT_LENGTH

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {draft.kind === 'skipped' && (
          <p className="mb-2 text-sm text-gray-700">
            Ticket too long — edit it down to under {MAX_TEXT_LENGTH} characters before retrying
          </p>
        )}
        <textarea
          value={draft.text}
          onChange={(event) => onTextChange(event.target.value)}
          rows={3}
          className={`w-full resize-none rounded-md border p-2 text-sm focus:outline-none ${
            isOverLimit ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        <p className={`mt-1 text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
          {draft.text.length} / {MAX_TEXT_LENGTH} characters
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying || draft.text.trim() === '' || isOverLimit}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isRetrying}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
      >
        {badge.label}
      </span>
      <p className="mt-2 text-sm text-gray-900">{truncate(draft.text)}</p>
      <p className="mt-1 text-xs text-gray-500">{draft.reason}</p>
      <button
        type="button"
        onClick={onEdit}
        className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Edit &amp; Retry
      </button>
    </div>
  )
}
