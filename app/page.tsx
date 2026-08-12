'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <div className="container">
      <div className="card">
        <p style={{ textAlign: 'center' }}>Redirecting...</p>
      </div>
    </div>
  )
}
