'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Головна', icon: '🏠' },
  { href: '/catalog', label: 'Каталог', icon: '🛍️' },
  { href: '/cart', label: 'Кошик', icon: '🛒' },
  { href: '/orders', label: 'Замовлення', icon: '📦' },
  { href: '/profile', label: 'Профіль', icon: '👤' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex border-t z-50 safe-area-pb"
      style={{
        backgroundColor: 'var(--tg-theme-bg-color)',
        borderColor: 'var(--tg-theme-secondary-bg-color)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center py-2 gap-0.5 transition-opacity',
              isActive ? 'opacity-100' : 'opacity-50'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-hint-color)' }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
