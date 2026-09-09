const API_BASE_URL = 'http://localhost:8000'

export async function fetchTickets() {
  const res = await fetch(`${API_BASE_URL}/tickets`)
  if (!res.ok) throw new Error('Failed to load tickets')
  return res.json()
}

export async function classifyTickets(payload) {
  const res = await fetch(`${API_BASE_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.detail || 'Failed to classify tickets')
  }
  return res.json()
}

export async function exportCsv() {
  const res = await fetch(`${API_BASE_URL}/export`)
  if (!res.ok) throw new Error('Failed to export tickets')

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'tickets_export.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
