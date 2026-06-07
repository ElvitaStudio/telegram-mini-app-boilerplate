'use client'

import { useEffect } from 'react'
import { initTelegram, applyTelegramTheme } from '@/lib/telegram'

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTelegram()
    applyTelegramTheme()
  }, [])

  return <>{children}</>
}
