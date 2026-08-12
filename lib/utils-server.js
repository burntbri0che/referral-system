const crypto = require('crypto')

function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

function validatePassword(password) {
  // At least 8 characters, contains at least one letter and one number
  if (password.length < 8) return false
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  return hasLetter && hasNumber
}

function sanitizeEmail(email) {
  return email.trim().toLowerCase()
}

module.exports = {
  generateReferralCode,
  validateEmail,
  validatePassword,
  sanitizeEmail
}
