'use client'

import { useEffect, useState } from 'react'
import { api, type SubscriptionStatus } from '@/lib/api'

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.subscriptions.status()
      .then(res => { if (res.success) setSubscription(res.data) })
      .catch(() => {}) // Non-fatal
      .finally(() => setLoading(false))
  }, [])

  return {
    subscription,
    isSubscribed: subscription?.is_subscribed ?? false,
    loading,
  }
}
