// src/components/layouts/FormSection.tsx
'use client'

import { ReactNode } from 'react'

interface FormSectionProps {
  title?: string
  children: ReactNode
  cols?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function FormSection({ title, children, cols = 6, className = '' }: FormSectionProps) {
  const colsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }

  return (
    <div className={className}>
      {title && <h2 className="text-[11px] font-semibold mb-2">{title}</h2>}
      <div className={`grid ${colsClass[cols]} gap-2`}>
        {children}
      </div>
    </div>
  )
}
