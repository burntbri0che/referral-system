import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Referral System',
  description: 'A referral system with rewards',
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
