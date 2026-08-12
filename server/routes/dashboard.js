const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user

    // Get user data with referrals
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        referralCode: true,
        points: true,
        createdAt: true,
        referrals: {
          select: {
            id: true,
            email: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!userData) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        referralCode: userData.referralCode,
        points: userData.points,
        createdAt: userData.createdAt
      },
      referrals: userData.referrals,
      stats: {
        totalReferrals: userData.referrals.length,
        totalPoints: userData.points
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
