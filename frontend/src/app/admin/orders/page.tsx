'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, type AdminOrder } from '@/lib/api'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { useBackButton } from '@/hooks/useBackButton'
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from '@/lib/utils'

const STATUSES = ['', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useBackButton(() => router.push('/admin'))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.orders({ page, limit: 30, status: statusFilter || undefined })
      setOrders(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (order: AdminOrder, status: string) => {
    try {
      await api.admin.updateOrderStatus(order.id, status)
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: '#ff9500',
    confirmed: '#007aff',
    preparing: '#5856d6',
    ready: '#34c759',
    delivered: '#34c759',
    cancelled: '#ff3b30',
  }

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold">Замовлення <span className="tg-hint text-base font-normal">({total})</span></h1>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors"
            style={{
              backgroundColor: statusFilter === s ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-secondary-bg-color)',
              color: statusFilter === s ? 'var(--tg-theme-button-text-color)' : 'var(--tg-theme-text-color)',
            }}
          >
            {s ? ORDER_STATUS_LABELS[s] : 'Всі'}
          </button>
        ))}
      </div>

      {error && <p className="tg-destructive text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-tg-button border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <TelegramCard key={order.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">#{order.id} · User {order.user_id}</p>
                  <p className="tg-hint text-xs">{formatDate(order.created_at)} · {order.items_count} поз.</p>
                </div>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[order.status] ?? '#999' }}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: 'var(--tg-theme-button-color)' }}>
                  {formatPrice(order.total)}
                </span>
                <select
                  value={order.status}
                  onChange={e => updateStatus(order, e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
                >
                  {STATUSES.filter(Boolean).map(s => (
                    <option key={s} value={s}>{ORDER_STATUS_LABELS[s] ?? s}</option>
                  ))}
                </select>
              </div>
            </TelegramCard>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-2 rounded-xl text-sm disabled:opacity-30"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >← Назад</button>
        <span className="px-3 py-2 text-sm tg-hint">{page}</span>
        <button
          disabled={orders.length < 30}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-2 rounded-xl text-sm disabled:opacity-30"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >Далі →</button>
      </div>
    </div>
  )
}
