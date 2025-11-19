'use client'

import { forwardRef } from 'react'
import ReactDatePicker, { ReactDatePickerProps } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface DatePickerProps extends Omit<ReactDatePickerProps, 'onChange'> {
  onChange: (date: Date | null) => void
  value?: Date | null
  minDate?: Date
  maxDate?: Date
  placeholder?: string
  className?: string
}

const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder, className, style }, ref) => (
  <input
    type="text"
    value={value}
    onClick={onClick}
    ref={ref}
    placeholder={placeholder}
    readOnly
    className={className || "filter-input"}
    style={{
      width: '110px',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      height: '28px',
      border: '1px solid var(--color-border, #d1d5db)',
      cursor: 'pointer',
      backgroundColor: 'var(--color-surface, #fff)',
      color: 'var(--color-text, #000)',
      boxSizing: 'border-box',
      display: 'inline-block',
      ...style
    }}
  />
))

CustomInput.displayName = 'CustomInput'

export default function DatePicker({
  onChange,
  value,
  minDate,
  maxDate,
  placeholder = '날짜 선택',
  className,
  ...props
}: DatePickerProps) {
  return (
    <ReactDatePicker
      selected={value}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat="yyyy-MM-dd"
      dateFormatCalendar="yyyy / MM"
      customInput={<CustomInput placeholder={placeholder} className={className} />}
      calendarClassName="custom-calendar"
      popperClassName="datepicker-popper"
      popperPlacement="bottom-start"
      {...props}
    />
  )
}
