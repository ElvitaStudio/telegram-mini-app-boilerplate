'use client'

import Link from 'next/link'
import { useTelegram } from '@/hooks/useTelegram'
import { useSubscription } from '@/hooks/useSubscription'
import { useBackButton } from '@/hooks/useBackButton'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { closeApp } from '@/lib/telegram'

export default function ProfilePage() {
  const { user, colorScheme } = useTelegram()
  const { isSubscribed, subscription } = useSubscription()

  useBackButton()

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold">Профіль</h1>

      {/* Avatar card */}
      <TelegramCard className="flex items-center gap-4">
        {user?.photo_url ? (
          <img src={user.photo_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            {user?.first_name?.[0] ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-base">{user?.first_name} {user?.last_name}</p>
            {isSubscribed && <span title="PRO">⭐</span>}
          </div>
          {user?.username && <p className="tg-hint text-sm">@{user.username}</p>}
          <p className="text-xs tg-hint mt-1">ID: {user?.id}</p>
        </div>
      </TelegramCard>

      {/* Subscription banner */}
      <Link href="/subscription">
        <TelegramCard
          className="flex items-center justify-between active:opacity-70 transition-opacity"
          style={isSubscribed
            ? { background: 'linear-gradient(135deg, #f7c948 0%, #f5a623 100%)', color: '#1a1a1a' }
            : undefined}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isSubscribed ? '⭐' : '🔒'}</span>
            <div>
              <p className="font-semibold text-sm">
                {isSubscribed ? 'PRO підписка активна' : 'Отримати PRO підписку'}
              </p>
              <p className="text-xs opacity-70">
                {isSubscribed
                  ? subscription?.expires_at
                    ? `До ${new Date(subscription.expires_at).toLocaleDateString('uk-UA')}`
                    : subscription?.plan ?? ''
                  : 'Ексклюзивні привілеї за Stars'}
              </p>
            </div>
          </div>
          <span className="text-lg">›</span>
        </TelegramCard>
      </Link>

      {/* Quick nav */}
      <div className="tg-section-header">Можливості</div>
      <TelegramCard className="divide-y"
        style={{ ['--tw-divide-color' as string]: 'var(--tg-theme-secondary-bg-color)' }}>
        {[
          { href: '/referral', icon: '🎁', label: 'Реферальна програма' },
          { href: '/orders', icon: '📦', label: 'Мої замовлення' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 py-3 active:opacity-70 transition-opacity">
            <span>{item.icon}</span>
            <span className="text-sm flex-1">{item.label}</span>
            <span className="tg-hint text-base">›</span>
          </Link>
        ))}
      </TelegramCard>

      <div className="tg-section-header">Налаштування</div>
      <TelegramCard className="divide-y"
        style={{ ['--tw-divide-color' as string]: 'var(--tg-theme-secondary-bg-color)' }}>
        <div className="flex justify-between items-center py-3">
          <span className="text-sm">Тема</span>
          <span className="tg-hint text-sm">{colorScheme === 'dark' ? 'Темна' : 'Світла'}</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-sm">Мова</span>
          <span className="tg-hint text-sm">{user?.language_code?.toUpperCase() ?? '—'}</span>
        </div>
      </TelegramCard>

      <button
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-opacity active:opacity-70"
        style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-destructive-text-color)' }}
        onClick={closeApp}
      >
        Закрити додаток
      </button>
    </div>
  )
}
