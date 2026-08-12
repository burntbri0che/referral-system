import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { generateReferralCode, validateEmail, validatePassword } from '@/lib/utils'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, referralCode } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // If referralCode is provided, validate it
    let referrerId: string | null = null
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      })

      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        )
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
    const user = await prisma.$transaction(async (tx) => {
      // Create the new user
      const newUser = await tx.user.create({
        data: {
          email,
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

    // Create response with cookie
    const response = NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        referralCode: user.referralCode,
        points: user.points
      }
    }, { status: 201 })

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
