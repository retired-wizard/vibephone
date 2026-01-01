import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VibePhone',
  description: 'A retro smartphone simulator with on-demand app generation',
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

