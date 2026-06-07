import { getInitData } from './telegram'
import type { ApiResponse, PaginatedResponse, Product, Order, PaymentLink } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const initData = getInitData()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  products: {
    list(params?: { category?: string; page?: number; limit?: number }) {
      const qs = new URLSearchParams(params as Record<string, string>).toString()
      return request<PaginatedResponse<Product>>(`/api/products${qs ? `?${qs}` : ''}`)
    },
    get(id: number) {
      return request<ApiResponse<Product>>(`/api/products/${id}`)
    },
  },

  orders: {
    create(payload: { items: { product_id: number; quantity: number }[]; payment_method: string }) {
      return request<ApiResponse<Order>>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    list() {
      return request<PaginatedResponse<Order>>('/api/orders')
    },
    get(id: number) {
      return request<ApiResponse<Order>>(`/api/orders/${id}`)
    },
  },

  payments: {
    createMonobank(orderId: number) {
      return request<ApiResponse<PaymentLink>>('/api/payments/monobank', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId }),
      })
    },
    createStars(orderId: number) {
      return request<ApiResponse<{ invoice_link: string }>>('/api/payments/stars', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId }),
      })
    },
  },
}
