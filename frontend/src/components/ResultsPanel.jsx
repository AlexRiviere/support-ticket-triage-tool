import { CATEGORIES } from '../constants'
import TicketCard from './TicketCard'

const FILTERS = ['all', ...CATEGORIES]

export default function ResultsPanel({ tickets, filter, onFilterChange, onExport, isExporting }) {
  const filteredTickets =
    filter === 'all' ? tickets : tickets.filter((ticket) => ticket.category === filter)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onFilterChange(option)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                filter === option
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {filteredTickets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          No tickets to show yet.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
