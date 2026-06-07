'use client'

import { useEffect, useState } from 'react'
import { api, type SubscriptionStatus } from '@/lib/api'
import { useBackButton } from '@/hooks/useBackButton'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { TelegramButton } from '@/components/ui/TelegramButton'
import { openInvoice, hapticNotification } from '@/lib/telegram'
import { formatDate } from '@/lib/utils'

export default function SubscriptionPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  useBackButton()

  const loadStatus = () => {
    api.subscriptions.status()
      .then(res => { if (res.success) setStatus(res.data) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStatus() }, [])

  const subscribe = async (plan: 'monthly' | 'yearly') => {
    setInvoiceLoading(plan)
    setError('')
    try {
      const res = await api.subscriptions.createInvoice(plan)
      if (!res.success || !res.data) throw new Error(res.error ?? 'Failed')
      openInvoice(res.data.invoice_link, (invoiceStatus) => {
        if (invoiceStatus === 'paid') {
          hapticNotification('success')
          loadStatus()
        }
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      hapticNotification('error')
    } finally {
      setInvoiceLoading(null)
    }
  }

  const cancel = async () => {
    if (!confirm('Скасувати підписку?')) return
    try {
      await api.subscriptions.cancel()
      loadStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-tg-button border-t-transparent animate-spin" />
      </div>
    )
  }

  const isActive = status?.is_subscribed

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Підписка</h1>
        <p className="tg-hint text-sm">Преміум доступ за Telegram Stars</p>
      </div>

      {/* Current status */}
      <TelegramCard className="flex items-center gap-3">
        <span className="text-3xl">{isActive ? '⭐' : '🔒'}</span>
        <div>
          <p className="font-semibold">{isActive ? 'Підписка активна' : 'Підписки немає'}</p>
          {isActive && status?.expires_at && (
            <p className="tg-hint text-xs">До {formatDate(status.expires_at)}</p>
          )}
          {isActive && status?.plan && (
            <p className="tg-hint text-xs capitalize">{status.plan === 'monthly' ? 'Місячна' : 'Річна'}</p>
          )}
        </div>
      </TelegramCard>

      {error && <p className="tg-destructive text-sm">{error}</p>}

      {!isActive ? (
        <>
          <div className="tg-section-header">Оберіть план</div>

          <TelegramCard className="space-y-4">
            <PlanOption
              title="Місячна підписка"
              stars={100}
              period="30 днів"
              badge={null}
              loading={invoiceLoading === 'monthly'}
              onSelect={() => subscribe('monthly')}
            />
          </TelegramCard>

          <TelegramCard className="space-y-4">
            <PlanOption
              title="Річна підписка"
              stars={999}
              period="365 днів"
              badge="Економія 17%"
              loading={invoiceLoading === 'yearly'}
              onSelect={() => subscribe('yearly')}
            />
          </TelegramCard>

          <div className="tg-section-header">Що входить</div>
          <TelegramCard className="space-y-2">
            {[
              '✅ Пріоритетне обслуговування',
              '✅ Ексклюзивні пропозиції',
              '✅ Бонусні бали за замовлення',
              '✅ Ранній доступ до нових товарів',
            ].map(item => (
              <p key={item} className="text-sm">{item}</p>
            ))}
          </TelegramCard>
        </>
      ) : (
        <TelegramButton variant="destructive" onClick={cancel}>
          Скасувати підписку
        </TelegramButton>
      )}
    </div>
  )
}

function PlanOption({
  title, stars, period, badge, loading, onSelect,
}: {
  title: string
  stars: number
  period: string
  badge: string | null
  loading: boolean
  onSelect: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="tg-hint text-xs">{period}</p>
        </div>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}>
            {badge}
          </span>
        )}
      </div>
      <TelegramButton loading={loading} onClick={onSelect}>
        ⭐ {stars} Stars
      </TelegramButton>
    </div>
  )
}
