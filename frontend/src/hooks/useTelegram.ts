'use client'

import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { getTelegramUser, getTelegramColorScheme, applyTelegramTheme } from '@/lib/telegram'
import type { TelegramUser } from '@/types'

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    WebApp.ready()
    WebApp.expand()
    applyTelegramTheme()

    setUser(getTelegramUser())
    setColorScheme(getTelegramColorScheme())
    setIsReady(true)

    const handleThemeChange = () => {
      applyTelegramTheme()
      setColorScheme(getTelegramColorScheme())
    }

    WebApp.onEvent('themeChanged', handleThemeChange)
    return () => WebApp.offEvent('themeChanged', handleThemeChange)
  }, [])

  return { user, colorScheme, isReady, webApp: typeof window !== 'undefined' ? WebApp : null }
}
