export const CATEGORIES = ['billing', 'technical', 'account', 'general']

export const CATEGORY_STYLES = {
  billing: 'bg-blue-100 text-blue-800',
  technical: 'bg-purple-100 text-purple-800',
  account: 'bg-indigo-100 text-indigo-800',
  general: 'bg-gray-100 text-gray-800',
}

export const SOURCES = ['manual', 'email', 'chat', 'web']

export function urgencyStyles(score) {
  if (score == null) return 'bg-gray-100 text-gray-500'
  if (score >= 8) return 'bg-red-100 text-red-800'
  if (score >= 5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}
