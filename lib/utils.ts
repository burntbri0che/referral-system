import crypto from 'crypto'

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, contains at least one letter and one number
  if (password.length < 8) return false
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  return hasLetter && hasNumber
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
