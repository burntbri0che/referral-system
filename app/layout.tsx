import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Referral System',
  description: 'A simple referral system with points and rewards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
