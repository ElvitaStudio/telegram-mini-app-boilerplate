'use client'

import { useEffect } from 'react'
import { showMainButton, hideMainButton, setMainButtonLoading } from '@/lib/telegram'

interface UseMainButtonOptions {
  text: string
  onClick: () => void
  visible?: boolean
  loading?: boolean
}

export function useMainButton({ text, onClick, visible = true, loading = false }: UseMainButtonOptions) {
  useEffect(() => {
    if (!visible) {
      hideMainButton()
      return
    }
    showMainButton(text, onClick)
    setMainButtonLoading(loading)

    return () => hideMainButton()
  }, [text, onClick, visible, loading])
}
