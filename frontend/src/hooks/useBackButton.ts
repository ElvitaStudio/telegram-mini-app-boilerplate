'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { showBackButton, hideBackButton } from '@/lib/telegram'

export function useBackButton(onBack?: () => void) {
  const router = useRouter()

  useEffect(() => {
    const handleBack = onBack ?? (() => router.back())
    showBackButton(handleBack)
    return () => hideBackButton()
  }, [onBack, router])
}
