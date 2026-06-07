import WebApp from '@twa-dev/sdk'

export function initTelegram() {
  if (typeof window === 'undefined') return
  WebApp.ready()
  WebApp.expand()
}

export function getTelegramUser() {
  if (typeof window === 'undefined') return null
  return WebApp.initDataUnsafe?.user ?? null
}

export function getInitData(): string {
  if (typeof window === 'undefined') return ''
  return WebApp.initData ?? ''
}

export function getTelegramColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return WebApp.colorScheme ?? 'light'
}

export function applyTelegramTheme() {
  if (typeof window === 'undefined') return
  const theme = WebApp.themeParams

  const root = document.documentElement
  const vars: Record<string, string | undefined> = {
    '--tg-theme-bg-color': theme.bg_color,
    '--tg-theme-text-color': theme.text_color,
    '--tg-theme-hint-color': theme.hint_color,
    '--tg-theme-link-color': theme.link_color,
    '--tg-theme-button-color': theme.button_color,
    '--tg-theme-button-text-color': theme.button_text_color,
    '--tg-theme-secondary-bg-color': theme.secondary_bg_color,
    '--tg-theme-header-bg-color': theme.header_bg_color,
    '--tg-theme-accent-text-color': theme.accent_text_color,
    '--tg-theme-section-bg-color': theme.section_bg_color,
    '--tg-theme-section-header-text-color': theme.section_header_text_color,
    '--tg-theme-subtitle-text-color': theme.subtitle_text_color,
    '--tg-theme-destructive-text-color': theme.destructive_text_color,
  }

  Object.entries(vars).forEach(([key, value]) => {
    if (value) root.style.setProperty(key, value)
  })
}

export function showMainButton(text: string, onClick: () => void) {
  WebApp.MainButton.setText(text)
  WebApp.MainButton.onClick(onClick)
  WebApp.MainButton.show()
}

export function hideMainButton() {
  WebApp.MainButton.hide()
  WebApp.MainButton.offClick(() => {})
}

export function setMainButtonLoading(loading: boolean) {
  if (loading) {
    WebApp.MainButton.showProgress()
  } else {
    WebApp.MainButton.hideProgress()
  }
}

export function showBackButton(onClick: () => void) {
  WebApp.BackButton.onClick(onClick)
  WebApp.BackButton.show()
}

export function hideBackButton() {
  WebApp.BackButton.hide()
  WebApp.BackButton.offClick(() => {})
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') {
  WebApp.HapticFeedback.impactOccurred(type)
}

export function hapticNotification(type: 'error' | 'success' | 'warning') {
  WebApp.HapticFeedback.notificationOccurred(type)
}

export function closeApp() {
  WebApp.close()
}

export function openInvoice(url: string, callback?: (status: string) => void) {
  WebApp.openInvoice(url, callback)
}
