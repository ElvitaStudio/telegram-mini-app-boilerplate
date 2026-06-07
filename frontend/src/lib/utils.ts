import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'UAH'): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Очікує',
  confirmed: 'Підтверджено',
  preparing: 'Готується',
  ready: 'Готово',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Очікує оплати',
  paid: 'Оплачено',
  failed: 'Помилка',
  refunded: 'Повернуто',
}
