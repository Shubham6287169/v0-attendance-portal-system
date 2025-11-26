// Email validation utility with alphanumeric checking
export function isValidEmail(email: string): boolean {
  // Email should only contain alphanumeric characters, dots, hyphens, and underscores before @
  // and alphanumeric characters with dots and hyphens after @
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

export function getEmailErrorMessage(email: string): string | null {
  if (!email) return "Email is required"
  if (!isValidEmail(email)) {
    return "Email must contain only alphanumeric characters, dots, hyphens, and underscores"
  }
  return null
}
