'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  referralCode: string
  points: number
  createdAt: string
}

interface Referral {
  id: string
  email: string
  createdAt: string
}

interface DashboardData {
  user: User
  referrals: Referral[]
  stats: {
    totalReferrals: number
    totalPoints: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/dashboard`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (data?.user.referralCode) {
      navigator.clipboard.writeText(data.user.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/logout`, {
      method: 'POST',
      credentials: 'include'
    })
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p style={{ textAlign: 'center' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">{error}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container">
      <div className="card">
        <h1>Dashboard</h1>
        <p>Welcome back, {data.user.email}</p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{data.stats.totalPoints}</div>
            <div className="stat-label">Total Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.stats.totalReferrals}</div>
            <div className="stat-label">Referrals</div>
          </div>
        </div>

        <div className="referral-code-section">
          <h2>Your Referral Code</h2>
          <p style={{ textAlign: 'left', marginBottom: '10px' }}>
            Share this code to earn 10 points per referral
          </p>
          <div className="referral-code">
            <span className="code">{data.user.referralCode}</span>
            <button onClick={handleCopyCode} className="copy-button">
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        <div className="referrals-section">
          <h2>Referred Users</h2>
          {data.referrals.length > 0 ? (
            <ul className="referrals-list">
              {data.referrals.map((referral) => (
                <li key={referral.id} className="referral-item">
                  <span className="referral-email">{referral.email}</span>
                  <span className="referral-date">{formatDate(referral.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              No referrals yet. Share your referral code to get started!
            </div>
          )}
        </div>

        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  )
}
