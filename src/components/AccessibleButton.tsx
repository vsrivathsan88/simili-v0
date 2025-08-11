'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  children: React.ReactNode
  loading?: boolean
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ variant = 'primary', size = 'md', icon, children, loading, className = '', disabled, ...props }, ref) => {
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-short',
      'focus:outline-none focus-visible:ring-focus focus-visible:ring-offset-focus',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:border-dashed',
      'active:scale-95 hover:shadow-md shadow-sm',
      
      // Size variants
      size === 'sm' && 'text-sm px-3 py-2 min-h-[44px]',
      size === 'md' && 'text-base px-4 py-2 min-h-[48px]',
      size === 'lg' && 'text-lg px-6 py-3 min-h-[52px]',
      
      // Rounded corners
      'rounded-lg',
      
      // Variant styles
      variant === 'primary' && [
        'bg-primary text-white border-2 border-primary',
        'hover:bg-indigo-600 hover:border-indigo-600',
        'active:bg-indigo-700 active:border-indigo-700'
      ],
      variant === 'secondary' && [
        'bg-white text-primary border-2 border-primary',
        'hover:bg-indigo-50',
        'active:bg-indigo-100'
      ],
      variant === 'ghost' && [
        'bg-transparent text-ink border-2 border-line',
        'hover:bg-gray-50 hover:border-gray-300',
        'active:bg-gray-100'
      ],
      
      className
    ].filter(Boolean).flat().join(' ')

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg 
              className="w-4 h-4 animate-spin" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
                opacity="0.25"
              />
              <path 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && <span aria-hidden="true">{icon}</span>}
            <span>{children}</span>
          </>
        )}
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'

export default AccessibleButton
