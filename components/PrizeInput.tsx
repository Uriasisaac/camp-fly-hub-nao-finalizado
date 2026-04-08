'use client'
import { useState } from 'react'
import { formatPrizeBR, parsePrizeBR } from '@/lib/format'

interface PrizeInputProps {
  id?: string
  value: number
  onChange: (n: number) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}

export default function PrizeInput({
  id,
  value,
  onChange,
  placeholder = 'R$ 0,00',
  className,
  'aria-label': ariaLabel,
}: PrizeInputProps) {
  const [focused, setFocused] = useState(false)
  const [rawText, setRawText] = useState('')

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      autoComplete="off"
      placeholder={placeholder}
      className={className}
      value={focused ? rawText : formatPrizeBR(value)}
      onFocus={() => {
        setRawText(value > 0 ? String(value) : '')
        setFocused(true)
      }}
      onChange={(e) => {
        // Permite dígitos, vírgula e ponto enquanto digita
        setRawText(e.target.value.replace(/[^\d.,]/g, ''))
      }}
      onBlur={() => {
        setFocused(false)
        onChange(parsePrizeBR(rawText))
      }}
    />
  )
}
