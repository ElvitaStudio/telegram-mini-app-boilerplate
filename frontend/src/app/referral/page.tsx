'use client'

import { useEffect, useState } from 'react'
import { api, type ReferralStats, type LeaderboardEntry } from '@/lib/api'
import { useBackButton } from '@/hooks/useBackButton'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { TelegramButton } from '@/components/ui/TelegramButton'
import { hapticNotification, hapticFeedback } from '@/lib/telegram'
import WebApp from '@twa-dev/sdk'

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useBackButton()

  useEffect(() => {
    Promise.all([api.referrals.myStats(), api.referrals.leaderboard()])
      .then(([s, l]) => {
        if (s.success) setStats(s.data)
        if (l.success && Array.isArray(l.data)) setLeaderboard(l.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const copyLink = async () => {
    if (!stats?.referral_link) return
    try {
      await navigator.clipboard.writeText(stats.referral_link)
      setCopied(true)
      hapticNotification('success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: share via Telegram
      WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(stats.referral_link)}`)
    }
  }

  const shareLink = () => {
    if (!stats?.referral_link) return
    hapticFeedback('light')
    const text = encodeURIComponent('Приєднуйся до нашого магазину в Telegram! 🛍')
    const url = encodeURIComponent(stats.referral_link)
    WebApp.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-tg-button border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Реферальна програма</h1>
        <p className="tg-hint text-sm">Запрошуй друзів і отримуй бонуси</p>
      </div>

      {stats && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <TelegramCard className="flex flex-col items-center py-3 gap-1">
              <span className="font-bold text-xl">{stats.total_referrals}</span>
              <span className="tg-hint text-xs text-center">Запрошено</span>
            </TelegramCard>
            <TelegramCard className="flex flex-col items-center py-3 gap-1">
              <span className="font-bold text-xl">{stats.awarded_referrals}</span>
              <span className="tg-hint text-xs text-center">Підтверджено</span>
            </TelegramCard>
            <TelegramCard className="flex flex-col items-center py-3 gap-1">
              <span className="font-bold text-xl" style={{ color: 'var(--tg-theme-button-color)' }}>
                {stats.current_credits}
              </span>
              <span className="tg-hint text-xs text-center">Бонусів</span>
            </TelegramCard>
          </div>

          {/* Referral link */}
          <TelegramCard className="space-y-3">
            <p className="font-semibold text-sm">Ваше реферальне посилання</p>
            <div
              className="px-3 py-2 rounded-xl text-xs break-all"
              style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-hint-color)' }}
            >
              {stats.referral_link || '—'}
            </div>
            <div className="flex gap-2">
              <TelegramButton
                size="sm"
                variant="secondary"
                onClick={copyLink}
                className="flex-1 !w-auto"
              >
                {copied ? '✓ Скопійовано' : '📋 Копіювати'}
              </TelegramButton>
              <TelegramButton
                size="sm"
                onClick={shareLink}
                className="flex-1 !w-auto"
              >
                ↗ Поділитись
              </TelegramButton>
            </div>
          </TelegramCard>

          {/* How it works */}
          <TelegramCard className="space-y-2">
            <p className="font-semibold text-sm">Як це працює</p>
            <div className="space-y-2">
              {[
                { step: '1', text: `Поділіться посиланням з другом` },
                { step: '2', text: 'Друг реєструється через ваше посилання' },
                { step: '3', text: `Ви отримуєте ${stats.total_bonus_earned || 50} бонусних балів` },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
                  >
                    {item.step}
                  </div>
                  <p className="text-sm pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          </TelegramCard>
        </>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <>
          <div className="tg-section-header">Топ рефералів</div>
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <TelegramCard key={entry.user_id} className="flex items-center gap-3">
                <span className="text-lg font-bold w-6 text-center tg-hint">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {entry.first_name}
                    {entry.username && <span className="tg-hint font-normal"> @{entry.username}</span>}
                  </p>
                </div>
                <span className="font-bold text-sm" style={{ color: 'var(--tg-theme-button-color)' }}>
                  {entry.referral_count} 👥
                </span>
              </TelegramCard>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
