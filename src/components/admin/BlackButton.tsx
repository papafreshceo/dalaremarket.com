import React, { CSSProperties } from 'react'

interface BlackButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  style?: CSSProperties
}

export default function BlackButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  style
}: BlackButtonProps) {
  const baseStyles: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
  }

  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      background: '#000',
      color: '#fff',
    },
    secondary: {
      background: '#fff',
      color: '#000',
      border: '1px solid #e5e7eb',
    },
    danger: {
      background: '#ef4444',
      color: '#fff',
    },
  }

  const sizeStyles: Record<string, CSSProperties> = {
    sm: {
      padding: '6px 12px',
      fontSize: '12px',
    },
    md: {
      padding: '8px 16px',
      fontSize: '14px',
    },
    lg: {
      padding: '10px 20px',
      fontSize: '16px',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.background = '#1f1f1f'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.background = '#000'
        }
      }}
    >
      {children}
    </button>
  )
}
