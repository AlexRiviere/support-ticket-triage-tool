import Papa from 'papaparse'
import { useRef, useState } from 'react'
import { SOURCES } from '../constants'

const TABS = [
  { id: 'paste', label: 'Paste Tickets' },
  { id: 'csv', label: 'Upload CSV' },
]

function findTextColumn(fields, data) {
  return (
    fields.find((field) =>
      data.some((row) => {
        const value = row[field]
        return typeof value === 'string' && value.trim() !== '' && Number.isNaN(Number(value))
      }),
    ) ?? fields[0]
  )
}

export default function InputPanel({ onClassify }) {
  const [activeTab, setActiveTab] = useState('paste')
  const [pasteText, setPasteText] = useState('')
  const [csvRows, setCsvRows] = useState(null)
  const [csvFileName, setCsvFileName] = useState(null)
  const [source, setSource] = useState('manual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setLocalError(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields || []
        const textField = findTextColumn(fields, results.data)

        const rows = results.data
          .map((row) => (textField ? row[textField] : null))
          .filter((value) => typeof value === 'string' && value.trim() !== '')
          .map((value) => value.trim())

        if (rows.length === 0) {
          setLocalError('No usable text found in that CSV.')
          setCsvRows(null)
          setCsvFileName(null)
          return
        }

        setCsvRows(rows)
        setCsvFileName(file.name)
      },
      error: (err) => setLocalError(`Failed to parse CSV: ${err.message}`),
    })
  }

  async function handleClassify() {
    setLocalError(null)

    const ticketsPayload =
      activeTab === 'paste'
        ? pasteText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((text) => ({ text, source }))
        : (csvRows || []).map((text) => ({ text, source }))

    if (ticketsPayload.length === 0) {
      setLocalError('Add at least one ticket before classifying.')
      return
    }

    setIsSubmitting(true)
    try {
      await onClassify(ticketsPayload)
      setPasteText('')
      setCsvRows(null)
      setCsvFileName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'paste' ? (
        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder="Paste one ticket per line..."
          rows={10}
          className="w-full resize-none rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
        />
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          {csvFileName && csvRows && (
            <p className="mt-2 text-sm text-gray-600">
              Loaded {csvRows.length} ticket{csvRows.length === 1 ? '' : 's'} from{' '}
              <span className="font-medium">{csvFileName}</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <label htmlFor="source" className="text-sm font-medium text-gray-700">
          Source
        </label>
        <select
          id="source"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          {SOURCES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {localError && <p className="mt-3 text-sm text-red-600">{localError}</p>}

      <button
        type="button"
        onClick={handleClassify}
        disabled={isSubmitting}
        className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {isSubmitting ? 'Classifying...' : 'Classify Tickets'}
      </button>
    </div>
  )
}
