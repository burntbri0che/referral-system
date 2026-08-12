import crypto from 'crypto'

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  // At least 6 characters
  return password.length >= 6
}
