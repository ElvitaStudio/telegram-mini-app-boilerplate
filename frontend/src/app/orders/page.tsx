'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useBackButton } from '@/hooks/useBackButton'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/utils'
import type { Order } from '@/types'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useBackButton()

  useEffect(() => {
    api.orders.list()
      .then(res => setOrders(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-tg-button border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="px-4 pt-6 tg-destructive text-center">{error}</div>
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <span className="text-6xl">📦</span>
        <p className="font-semibold text-lg">Замовлень ще немає</p>
        <p className="tg-hint text-sm">Ваші замовлення з&apos;являться тут</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold">Замовлення</h1>
      <div className="space-y-3">
        {orders.map(order => (
          <TelegramCard key={order.id} className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">Замовлення #{order.id}</p>
                <p className="tg-hint text-xs">{formatDate(order.created_at)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="tg-hint">{item.product_name} × {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between items-center"
              style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
              <span className="text-xs tg-hint">{PAYMENT_STATUS_LABELS[order.payment_status]}</span>
              <span className="font-bold" style={{ color: 'var(--tg-theme-button-color)' }}>
                {formatPrice(order.total)}
              </span>
            </div>
          </TelegramCard>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#ff9500',
    confirmed: '#007aff',
    preparing: '#5856d6',
    ready: '#34c759',
    delivered: '#34c759',
    cancelled: '#ff3b30',
  }

  return (
    <span
      className="text-xs font-semibold px-2 py-1 rounded-full text-white"
      style={{ backgroundColor: colors[status] ?? '#999' }}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  )
}
