import { cn } from '@/lib/utils'

interface TelegramButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function TelegramButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: TelegramButtonProps) {
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs rounded-lg',
    md: 'py-3 px-4 text-sm rounded-xl w-full',
    lg: 'py-4 px-6 text-base rounded-xl w-full',
  }

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--tg-theme-button-color)',
      color: 'var(--tg-theme-button-text-color)',
    },
    secondary: {
      backgroundColor: 'var(--tg-theme-secondary-bg-color)',
      color: 'var(--tg-theme-text-color)',
    },
    destructive: {
      backgroundColor: 'var(--tg-theme-secondary-bg-color)',
      color: 'var(--tg-theme-destructive-text-color)',
    },
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={variantStyles[variant]}
      className={cn(
        'font-semibold transition-opacity active:opacity-70 disabled:opacity-40 flex items-center justify-center gap-2',
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  )
}
