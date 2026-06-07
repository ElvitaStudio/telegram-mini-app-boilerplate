'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, type AdminUser } from '@/lib/api'
import { TelegramCard } from '@/components/ui/TelegramCard'
import { useBackButton } from '@/hooks/useBackButton'
import { formatDate } from '@/lib/utils'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useBackButton(() => router.push('/admin'))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.users({ page, limit: 30, search: search || undefined })
      setUsers(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const toggleBlock = async (user: AdminUser) => {
    try {
      await api.admin.blockUser(user.id, !user.is_blocked)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold">Користувачі <span className="tg-hint text-base font-normal">({total})</span></h1>

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Пошук за ім'ям або username..."
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
      />

      {error && <p className="tg-destructive text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-tg-button border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <TelegramCard key={user.id} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
              >
                {user.first_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {user.first_name} {user.last_name ?? ''}
                  {user.has_subscription && <span className="ml-1 text-yellow-500">⭐</span>}
                </p>
                <p className="tg-hint text-xs">
                  {user.username ? `@${user.username}` : `ID: ${user.id}`}
                  {' · '}
                  {formatDate(user.joined_at)}
                </p>
              </div>
              <button
                onClick={() => toggleBlock(user)}
                className="text-xs px-2 py-1 rounded-lg font-semibold flex-shrink-0"
                style={{
                  backgroundColor: user.is_blocked ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-secondary-bg-color)',
                  color: user.is_blocked ? 'var(--tg-theme-button-text-color)' : 'var(--tg-theme-destructive-text-color)',
                }}
              >
                {user.is_blocked ? 'Розблок' : 'Блок'}
              </button>
            </TelegramCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex gap-2 justify-center">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-2 rounded-xl text-sm disabled:opacity-30"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >← Назад</button>
        <span className="px-3 py-2 text-sm tg-hint">{page}</span>
        <button
          disabled={users.length < 30}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-2 rounded-xl text-sm disabled:opacity-30"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >Далі →</button>
      </div>
    </div>
  )
}
