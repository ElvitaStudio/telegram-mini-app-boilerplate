import { cn } from '@/lib/utils'

interface TelegramCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function TelegramCard({ children, className, style, ...props }: TelegramCardProps) {
  return (
    <div
      {...props}
      style={{
        backgroundColor: 'var(--tg-theme-section-bg-color)',
        ...style,
      }}
      className={cn('rounded-2xl p-4', className)}
    >
      {children}
    </div>
  )
}
