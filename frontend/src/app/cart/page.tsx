'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useBackButton } from '@/hooks/useBackButton'
import { useMainButton } from '@/hooks/useMainButton'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { TelegramButton } from '@/components/ui/TelegramButton'
import { formatPrice } from '@/lib/utils'
import { hapticFeedback, hapticNotification, openInvoice } from '@/lib/telegram'
import { api } from '@/lib/api'

export default function CartPage() {
  const { items, total, count, updateQuantity, removeItem, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'monobank' | 'telegram_stars'>('monobank')
  const router = useRouter()

  useBackButton()

  const handleCheckout = async () => {
    if (items.length === 0) return
    setLoading(true)
    hapticFeedback('medium')

    try {
      const orderRes = await api.orders.create({
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        payment_method: paymentMethod,
      })

      if (!orderRes.success || !orderRes.data) throw new Error(orderRes.error ?? 'Order failed')
      const orderId = orderRes.data.id

      if (paymentMethod === 'monobank') {
        const payRes = await api.payments.createMonobank(orderId)
        if (!payRes.success || !payRes.data) throw new Error(payRes.error ?? 'Payment failed')
        window.open(payRes.data.payment_url, '_blank')
      } else {
        const payRes = await api.payments.createStars(orderId)
        if (!payRes.success || !payRes.data) throw new Error(payRes.error ?? 'Payment failed')
        openInvoice(payRes.data.invoice_link, (status) => {
          if (status === 'paid') {
            hapticNotification('success')
            clearCart()
            router.push('/orders')
          }
        })
        return
      }

      clearCart()
      router.push('/orders')
    } catch (err) {
      hapticNotification('error')
      alert(err instanceof Error ? err.message : 'Помилка оплати')
    } finally {
      setLoading(false)
    }
  }

  useMainButton({
    text: `Оплатити ${formatPrice(total)}`,
    onClick: handleCheckout,
    visible: count > 0,
    loading,
  })

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4">
        <span className="text-6xl">🛒</span>
        <p className="font-semibold text-lg">Кошик порожній</p>
        <p className="tg-hint text-sm text-center">Додайте товари з каталогу</p>
        <TelegramButton onClick={() => router.push('/catalog')}>
          До каталогу
        </TelegramButton>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold">Кошик</h1>

      <div className="space-y-3">
        {items.map(item => (
          <TelegramCard key={item.product.id} className="flex gap-3 items-center">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.product.name}</p>
              <p className="tg-hint text-xs">{formatPrice(item.product.price)} × {item.quantity}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
                onClick={() => {
                  updateQuantity(item.product.id, item.quantity - 1)
                  hapticFeedback('light')
                }}
              >
                −
              </button>
              <span className="w-6 text-center font-semibold">{item.quantity}</span>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
                onClick={() => {
                  updateQuantity(item.product.id, item.quantity + 1)
                  hapticFeedback('light')
                }}
              >
                +
              </button>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center tg-destructive"
                onClick={() => {
                  removeItem(item.product.id)
                  hapticFeedback('light')
                }}
              >
                ✕
              </button>
            </div>
          </TelegramCard>
        ))}
      </div>

      <TelegramCard className="space-y-3">
        <p className="font-semibold text-sm">Спосіб оплати</p>
        <div className="space-y-2">
          {(['monobank', 'telegram_stars'] as const).map(method => (
            <button
              key={method}
              className="w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-opacity active:opacity-70"
              style={{
                backgroundColor: paymentMethod === method
                  ? 'var(--tg-theme-button-color)'
                  : 'var(--tg-theme-secondary-bg-color)',
                color: paymentMethod === method
                  ? 'var(--tg-theme-button-text-color)'
                  : 'var(--tg-theme-text-color)',
              }}
              onClick={() => setPaymentMethod(method)}
            >
              <span>{method === 'monobank' ? '💳' : '⭐'}</span>
              <span className="text-sm font-medium">
                {method === 'monobank' ? 'Monobank' : 'Telegram Stars'}
              </span>
            </button>
          ))}
        </div>
      </TelegramCard>

      <TelegramCard className="flex justify-between items-center">
        <span className="font-semibold">Разом</span>
        <span className="font-bold text-lg" style={{ color: 'var(--tg-theme-button-color)' }}>
          {formatPrice(total)}
        </span>
      </TelegramCard>
    </div>
  )
}
