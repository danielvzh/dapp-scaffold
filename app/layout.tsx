import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Wallet Adapter Demo',
  description: 'Connect Unisat or Xverse'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
