'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <span className="text-5xl">⚠️</span>
      <p className="font-semibold">Щось пішло не так</p>
      <p className="tg-hint text-sm">{error.message}</p>
      <button
        className="tg-button mt-2"
        style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
        onClick={reset}
      >
        Спробувати знову
      </button>
    </div>
  )
}
