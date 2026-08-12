const express = require('express')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { generateToken } = require('../../lib/auth-server')
const { validateEmail, validatePassword, sanitizeEmail, generateReferralCode } = require('../../lib/utils-server')

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, referralCode } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and contain both letters and numbers'
      })
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    })

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    // If referralCode is provided, validate it
    let referrerId = null
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      })

      if (!referrer) {
        return res.status(400).json({ error: 'Invalid referral code' })
      }

      referrerId = referrer.id
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate unique referral code
    let newReferralCode = generateReferralCode()
    let isUnique = false

    while (!isUnique) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: newReferralCode }
      })
      if (!existing) {
        isUnique = true
      } else {
        newReferralCode = generateReferralCode()
      }
    }

    // Create user and award points to referrer in a transaction
    // Transaction ensures atomic operation: either both user creation and point award succeed, or both fail
    // This prevents duplicate referral rewards
    const user = await prisma.$transaction(async (tx) => {
      // Create the new user
      const newUser = await tx.user.create({
        data: {
          email: sanitizedEmail,
          password: hashedPassword,
          referralCode: newReferralCode,
          referredById: referrerId
        },
        select: {
          id: true,
          email: true,
          referralCode: true,
          points: true
        }
      })

      // If user was referred, award 10 points to the referrer
      if (referrerId) {
        await tx.user.update({
          where: { id: referrerId },
          data: {
            points: {
              increment: 10
            }
          }
        })
      }

      return newUser
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email
    })

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 * 1000 // 7 days
    })

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        referralCode: user.referralCode,
        points: user.points
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (!validateEmail(email)) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Sanitize input
    const sanitizedEmail = sanitizeEmail(email)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        referralCode: true,
        points: true
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email
    })

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 * 1000 // 7 days
    })

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        referralCode: user.referralCode,
        points: user.points
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  res.status(200).json({ message: 'Logout successful' })
})

module.exports = router
