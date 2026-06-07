import { getInitData } from './telegram'
import type { ApiResponse, PaginatedResponse, Product, Order, PaymentLink } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const secret = typeof window !== 'undefined' ? sessionStorage.getItem('admin_secret') ?? '' : ''
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': secret,
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
      return request<ApiResponse<Order>>('/api/orders', { method: 'POST', body: JSON.stringify(payload) })
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

  subscriptions: {
    status() {
      return request<ApiResponse<SubscriptionStatus>>('/api/subscriptions/status')
    },
    createInvoice(plan: 'monthly' | 'yearly') {
      return request<ApiResponse<{ invoice_link: string }>>('/api/subscriptions/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })
    },
    cancel() {
      return request<ApiResponse<{ status: string }>>('/api/subscriptions/cancel', { method: 'POST' })
    },
  },

  referrals: {
    myStats() {
      return request<ApiResponse<ReferralStats>>('/api/referrals/my')
    },
    leaderboard() {
      return request<ApiResponse<LeaderboardEntry[]>>('/api/referrals/leaderboard')
    },
  },

  admin: {
    stats() {
      return adminRequest<ApiResponse<AdminStats>>('/api/admin/stats')
    },
    users(params?: { page?: number; limit?: number; search?: string }) {
      const qs = new URLSearchParams(params as Record<string, string>).toString()
      return adminRequest<PaginatedResponse<AdminUser>>(`/api/admin/users${qs ? `?${qs}` : ''}`)
    },
    blockUser(userId: number, blocked: boolean) {
      return adminRequest(`/api/admin/users/${userId}/block?blocked=${blocked}`, { method: 'PATCH' })
    },
    orders(params?: { page?: number; limit?: number; status?: string }) {
      const qs = new URLSearchParams(params as Record<string, string>).toString()
      return adminRequest<PaginatedResponse<AdminOrder>>(`/api/admin/orders${qs ? `?${qs}` : ''}`)
    },
    updateOrderStatus(orderId: number, status: string) {
      return adminRequest(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    },
    broadcasts: {
      list() {
        return adminRequest<ApiResponse<BroadcastItem[]>>('/api/admin/broadcast')
      },
      create(message: string, parseMode = 'HTML', scheduledAt?: string) {
        return adminRequest<ApiResponse<{ id: number; status: string }>>('/api/admin/broadcast', {
          method: 'POST',
          body: JSON.stringify({ message, parse_mode: parseMode, scheduled_at: scheduledAt ?? null }),
        })
      },
      send(id: number) {
        return adminRequest(`/api/admin/broadcast/${id}/send`, { method: 'POST' })
      },
    },
  },
}

// ─── Pro types ────────────────────────────────────────────────────────────────

export interface SubscriptionStatus {
  is_subscribed: boolean
  plan: string | null
  expires_at: string | null
  status: string | null
}

export interface ReferralStats {
  referral_link: string
  total_referrals: number
  awarded_referrals: number
  total_bonus_earned: number
  current_credits: number
}

export interface LeaderboardEntry {
  user_id: number
  username: string | null
  first_name: string
  referral_count: number
}

export interface AdminStats {
  total_users: number
  total_orders: number
  total_revenue: number
  active_subscriptions: number
  pending_orders: number
}

export interface AdminUser {
  id: number
  first_name: string
  last_name: string | null
  username: string | null
  joined_at: string
  credits: number
  is_blocked: boolean
  has_subscription: boolean
}

export interface AdminOrder {
  id: number
  user_id: number
  total: number
  status: string
  payment_method: string
  payment_status: string
  created_at: string
  items_count: number
}

export interface BroadcastItem {
  id: number
  message: string
  status: string
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  sent_count: number
  failed_count: number
}
