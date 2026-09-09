import DraftCard from './DraftCard'

export default function DraftsSection({ drafts, retryingIds, onEdit, onCancel, onTextChange, onRetry }) {
  if (drafts.length === 0) return null

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Needs Attention</h2>
        <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
          {drafts.length}
        </span>
      </div>
      <div className="space-y-3">
        {drafts.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            isRetrying={retryingIds.has(draft.id)}
            onEdit={() => onEdit(draft.id)}
            onCancel={() => onCancel(draft.id)}
            onTextChange={(text) => onTextChange(draft.id, text)}
            onRetry={() => onRetry(draft)}
          />
        ))}
      </div>
    </div>
  )
}
