import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <span className="text-5xl">🔍</span>
      <p className="font-bold text-xl">404</p>
      <p className="tg-hint text-sm">Сторінку не знайдено</p>
      <Link
        href="/"
        className="tg-button mt-2 inline-block px-6 py-3 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
      >
        На головну
      </Link>
    </div>
  )
}
