'use client'

import { useTelegram } from '@/hooks/useTelegram'
import { useBackButton } from '@/hooks/useBackButton'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { closeApp } from '@/lib/telegram'

export default function ProfilePage() {
  const { user, colorScheme } = useTelegram()

  useBackButton()

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold">Профіль</h1>

      <TelegramCard className="flex items-center gap-4">
        {user?.photo_url ? (
          <img
            src={user.photo_url}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            {user?.first_name?.[0] ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-base">
            {user?.first_name} {user?.last_name}
          </p>
          {user?.username && (
            <p className="tg-hint text-sm">@{user.username}</p>
          )}
          <p className="text-xs tg-hint mt-1">ID: {user?.id}</p>
        </div>
      </TelegramCard>

      <div className="tg-section-header">Налаштування</div>

      <TelegramCard className="space-y-0 divide-y"
        style={{ ['--tw-divide-color' as string]: 'var(--tg-theme-secondary-bg-color)' }}>
        <div className="flex justify-between items-center py-3">
          <span className="text-sm">Тема</span>
          <span className="tg-hint text-sm capitalize">{colorScheme === 'dark' ? 'Темна' : 'Світла'}</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-sm">Мова</span>
          <span className="tg-hint text-sm">{user?.language_code?.toUpperCase() ?? '—'}</span>
        </div>
      </TelegramCard>

      <button
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-opacity active:opacity-70"
        style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color)',
          color: 'var(--tg-theme-destructive-text-color)',
        }}
        onClick={closeApp}
      >
        Закрити додаток
      </button>
    </div>
  )
}
