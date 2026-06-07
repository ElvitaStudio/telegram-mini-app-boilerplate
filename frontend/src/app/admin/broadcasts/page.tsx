'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, type BroadcastItem } from '@/lib/api'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { TelegramButton } from '@/components/ui/TelegramButton'
import { useBackButton } from '@/hooks/useBackButton'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9500',
  running: '#007aff',
  done: '#34c759',
  failed: '#ff3b30',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Очікує',
  running: 'Надсилається',
  done: 'Надіслано',
  failed: 'Помилка',
}

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useBackButton(() => router.push('/admin'))

  const load = useCallback(async () => {
    try {
      const res = await api.admin.broadcasts.list()
      if (res.success && Array.isArray(res.data)) setBroadcasts(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError('')
    try {
      await api.admin.broadcasts.create(message, 'HTML', scheduledAt || undefined)
      setMessage('')
      setScheduledAt('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSending(false)
    }
  }

  const handleSendNow = async (id: number) => {
    try {
      await api.admin.broadcasts.send(id)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Розсилки</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm font-semibold px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
        >
          {showForm ? 'Скасувати' : '+ Нова'}
        </button>
      </div>

      {showForm && (
        <TelegramCard>
          <form onSubmit={handleCreate} className="space-y-3">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Текст повідомлення (підтримує HTML)"
              rows={4}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
            />
            <div className="space-y-1">
              <label className="text-xs tg-hint">Запланувати на (необов&apos;язково)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
              />
            </div>
            {error && <p className="tg-destructive text-xs">{error}</p>}
            <TelegramButton type="submit" loading={sending} disabled={!message.trim()}>
              {scheduledAt ? 'Запланувати' : 'Надіслати зараз'}
            </TelegramButton>
          </form>
        </TelegramCard>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-tg-button border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {broadcasts.map(b => (
            <TelegramCard key={b.id} className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm flex-1">{b.message}</p>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[b.status] ?? '#999' }}
                >
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs tg-hint">
                <span>
                  {b.status === 'done'
                    ? `✓ ${b.sent_count}/${b.total_recipients} доставлено`
                    : b.scheduled_at
                      ? `⏰ ${formatDate(b.scheduled_at)}`
                      : ''}
                </span>
                {b.status === 'pending' && (
                  <button
                    onClick={() => handleSendNow(b.id)}
                    className="text-xs font-semibold"
                    style={{ color: 'var(--tg-theme-button-color)' }}
                  >
                    Надіслати зараз
                  </button>
                )}
              </div>
            </TelegramCard>
          ))}
          {broadcasts.length === 0 && (
            <p className="text-center tg-hint text-sm py-8">Розсилок ще немає</p>
          )}
        </div>
      )}
    </div>
  )
}
