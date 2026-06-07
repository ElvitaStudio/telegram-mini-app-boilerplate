'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, type AdminStats } from '@/lib/api'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [secret, setSecret] = useState('')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadStats = useCallback(async () => {
    try {
      const res = await api.admin.stats()
      if (res.success && res.data) setStats(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      sessionStorage.removeItem('admin_secret')
      setAuthenticated(false)
    }
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_secret')
    if (stored) {
      setAuthenticated(true)
      loadStats()
    }
  }, [loadStats])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    sessionStorage.setItem('admin_secret', secret)
    try {
      const res = await api.admin.stats()
      if (res.success) {
        setStats(res.data)
        setAuthenticated(true)
      }
    } catch {
      sessionStorage.removeItem('admin_secret')
      setError('Невірний секрет')
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-4">
        <span className="text-4xl">🔐</span>
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color)',
              color: 'var(--tg-theme-text-color)',
            }}
            autoComplete="current-password"
          />
          {error && <p className="tg-destructive text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !secret}
            className="tg-button disabled:opacity-40"
          >
            {loading ? 'Перевірка...' : 'Увійти'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button
          className="text-xs tg-hint"
          onClick={() => { sessionStorage.removeItem('admin_secret'); setAuthenticated(false) }}
        >
          Вийти
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Користувачі" value={stats.total_users} icon="👤" />
          <StatCard label="Замовлення" value={stats.total_orders} icon="📦" />
          <StatCard label="Виручка" value={formatPrice(stats.total_revenue)} icon="💰" />
          <StatCard label="Підписки" value={stats.active_subscriptions} icon="⭐" />
          <StatCard label="Очікують" value={stats.pending_orders} icon="⏳" />
        </div>
      )}

      <div className="tg-section-header">Управління</div>
      <div className="space-y-2">
        {[
          { href: '/admin/users', icon: '👥', label: 'Користувачі' },
          { href: '/admin/orders', icon: '📋', label: 'Замовлення' },
          { href: '/admin/broadcasts', icon: '📢', label: 'Розсилки' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <TelegramCard className="flex items-center gap-3 active:opacity-70 transition-opacity">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
              <span className="ml-auto tg-hint">›</span>
            </TelegramCard>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <TelegramCard className="flex flex-col gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="font-bold text-xl">{value}</span>
      <span className="tg-hint text-xs">{label}</span>
    </TelegramCard>
  )
}
