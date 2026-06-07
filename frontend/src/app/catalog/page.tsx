'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useCart } from '@/hooks/useCart'
import { useBackButton } from '@/hooks/useBackButton'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { TelegramButton } from '@/components/ui/TelegramButton'
import { formatPrice } from '@/lib/utils'
import { hapticFeedback } from '@/lib/telegram'
import type { Product } from '@/types'

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCart()

  useBackButton()

  useEffect(() => {
    api.products.list()
      .then(res => setProducts(res.data))
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
    return (
      <div className="px-4 pt-6">
        <p className="tg-destructive text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold">Каталог</h1>
      <div className="space-y-3">
        {products.map(product => (
          <TelegramCard key={product.id} className="flex gap-4">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-semibold text-sm leading-tight">{product.name}</p>
              <p className="tg-hint text-xs line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-tg-button">{formatPrice(product.price)}</span>
                <TelegramButton
                  size="sm"
                  disabled={!product.in_stock}
                  onClick={() => {
                    addItem(product)
                    hapticFeedback('light')
                  }}
                >
                  {product.in_stock ? 'В кошик' : 'Немає'}
                </TelegramButton>
              </div>
            </div>
          </TelegramCard>
        ))}
      </div>
    </div>
  )
}
