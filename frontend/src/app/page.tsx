'use client'

import { useTelegram } from '@/hooks/useTelegram'
import { TelegramCard } from '@/components/ui/TelegramCard'
import Link from 'next/link'

export default function HomePage() {
  const { user, isReady } = useTelegram()

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-tg-button border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          Привіт{user?.first_name ? `, ${user.first_name}` : ''}! 👋
        </h1>
        <p className="tg-hint text-sm">Оберіть що вас цікавить</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/catalog">
          <TelegramCard className="flex flex-col items-center py-6 gap-3 active:opacity-70 transition-opacity">
            <span className="text-4xl">🛍️</span>
            <span className="font-semibold text-sm">Каталог</span>
          </TelegramCard>
        </Link>

        <Link href="/orders">
          <TelegramCard className="flex flex-col items-center py-6 gap-3 active:opacity-70 transition-opacity">
            <span className="text-4xl">📦</span>
            <span className="font-semibold text-sm">Замовлення</span>
          </TelegramCard>
        </Link>

        <Link href="/cart">
          <TelegramCard className="flex flex-col items-center py-6 gap-3 active:opacity-70 transition-opacity">
            <span className="text-4xl">🛒</span>
            <span className="font-semibold text-sm">Кошик</span>
          </TelegramCard>
        </Link>

        <Link href="/profile">
          <TelegramCard className="flex flex-col items-center py-6 gap-3 active:opacity-70 transition-opacity">
            <span className="text-4xl">👤</span>
            <span className="font-semibold text-sm">Профіль</span>
          </TelegramCard>
        </Link>
      </div>
    </div>
  )
}
