export default function SkippedBanner({ skipped, onDismiss }) {
  if (!skipped || skipped.length === 0) return null

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold">
          {skipped.length} ticket{skipped.length > 1 ? 's' : ''} skipped
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-700 hover:text-amber-900"
        >
          Dismiss
        </button>
      </div>
      <ul className="list-disc space-y-1 pl-5">
        {skipped.map((item, index) => (
          <li key={index}>
            <span className="font-medium">{item.reason}:</span> {item.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
