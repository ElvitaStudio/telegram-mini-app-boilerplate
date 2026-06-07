import type { Metadata, Viewport } from 'next'
import './globals.css'
import { TelegramProvider } from '@/components/ui/TelegramProvider'
import { BottomNav } from '@/components/ui/BottomNav'

export const metadata: Metadata = {
  title: 'Mini App',
  description: 'Telegram Mini App',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body>
        <TelegramProvider>
          <main className="pb-20 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  )
}
