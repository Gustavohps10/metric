'use client'

import {
  addSeconds,
  differenceInSeconds,
  format,
  isValid,
  parse,
  parseISO,
} from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib'

const parseFlexTime = (val: string): number | null => {
  if (!val) return 0
  const normalized = val.replace(',', '.').trim()

  if (normalized.includes(':')) {
    const parts = normalized.split(':').map(Number)
    if (parts.some(isNaN)) return null
    const [h, m, s] = parts
    return h + (m || 0) / 60 + (s || 0) / 3600
  }

  if (!isNaN(Number(normalized)) && normalized.includes('.')) {
    return Number(normalized)
  }

  const num = Number(normalized)
  if (isNaN(num)) return null

  if (num > 24) {
    const s = normalized
    if (s.length >= 2) {
      const h = Number(s[0])
      const m = Number(s.substring(1))
      return h + (m * 10) / 60
    }
  }
  return num
}

const decimalToHMS = (decimalHours?: number) => {
  if (decimalHours === undefined || decimalHours <= 0) return ''
  const totalSeconds = Math.round(decimalHours * 3600)
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

const toHHMM = (iso?: string) => {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'HH:mm')
  } catch {
    return ''
  }
}

const isValidHourRange = (val: string) => {
  if (!val) return true
  const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
  return regex.test(val)
}

interface TimeEntryInputsProps {
  startDate?: string
  endDate?: string
  timeSpent: number
  disabled?: boolean
  onChange: (data: {
    startDate?: string
    endDate?: string
    timeSpent: number
  }) => void
  className?: string
}

export const TimeEntryInputs = ({
  startDate,
  endDate,
  timeSpent,
  disabled,
  onChange,
  className,
}: TimeEntryInputsProps) => {
  const [localStart, setLocalStart] = useState(toHHMM(startDate))
  const [localEnd, setLocalEnd] = useState(toHHMM(endDate))
  const [localSpent, setLocalSpent] = useState(decimalToHMS(timeSpent))

  const [errors, setErrors] = useState({
    start: false,
    end: false,
    spent: false,
  })

  useEffect(() => {
    setLocalStart(toHHMM(startDate))
    setErrors((p) => ({ ...p, start: false }))
  }, [startDate])
  useEffect(() => {
    setLocalEnd(toHHMM(endDate))
    setErrors((p) => ({ ...p, end: false }))
  }, [endDate])
  useEffect(() => {
    setLocalSpent(decimalToHMS(timeSpent))
    setErrors((p) => ({ ...p, spent: false }))
  }, [timeSpent])

  const baseDate = useMemo(
    () => (startDate ? parseISO(startDate) : new Date()),
    [startDate],
  )

  const validateAndSync = (
    fStart: string,
    fEnd: string,
    fSpent: string,
    fieldTriggered: 'start' | 'end' | 'spent',
  ) => {
    const hasChanged =
      fStart !== toHHMM(startDate) ||
      fEnd !== toHHMM(endDate) ||
      fSpent !== decimalToHMS(timeSpent)

    if (!hasChanged) return

    const isStartValid = isValidHourRange(fStart)
    const isEndValid = isValidHourRange(fEnd)

    if (!isStartValid || !isEndValid) {
      setErrors({ start: !isStartValid, end: !isEndValid, spent: false })
      return
    }

    let decimal = 0
    let sISO = startDate
    let eISO = endDate

    if (fieldTriggered === 'spent') {
      const parsed = parseFlexTime(fSpent)
      if (parsed === null) {
        setErrors((prev) => ({ ...prev, spent: true }))
        return
      }
      decimal = parsed

      const startRef = startDate ? parseISO(startDate) : baseDate
      sISO = startRef.toISOString()
      eISO = addSeconds(startRef, Math.round(decimal * 3600)).toISOString()

      setLocalStart(format(parseISO(sISO), 'HH:mm'))
      setLocalEnd(format(parseISO(eISO), 'HH:mm'))
      setLocalSpent(decimalToHMS(decimal))
    } else {
      const sDate = parse(fStart, 'HH:mm', baseDate)
      const eDate = parse(fEnd, 'HH:mm', baseDate)

      if (isValid(sDate) && isValid(eDate)) {
        const seconds = differenceInSeconds(eDate, sDate)
        decimal = Number((seconds / 3600).toFixed(4))
        if (decimal < 0) {
          setErrors({ start: true, end: true, spent: false })
          return
        }
        sISO = sDate.toISOString()
        eISO = eDate.toISOString()
        setLocalSpent(decimalToHMS(decimal))
      }
    }

    setErrors({ start: false, end: false, spent: false })
    onChange({
      startDate: sISO,
      endDate: eISO,
      timeSpent: decimal,
    })
  }

  const handleTextChange = (val: string, setter: (v: string) => void) => {
    const cleaned = val.replace(/[^0-9:.,]/g, '')
    setter(cleaned)
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded border px-1 py-0.5 transition-all',
        disabled
          ? 'border-transparent bg-transparent'
          : 'bg-muted/20 border-border hover:border-border/80',
        className,
      )}
    >
      <Input
        disabled={disabled}
        value={localStart}
        onChange={(e) => {
          handleTextChange(e.target.value, setLocalStart)
          setErrors((p) => ({ ...p, start: false }))
        }}
        onBlur={() =>
          validateAndSync(localStart, localEnd, localSpent, 'start')
        }
        onKeyDown={(e) =>
          e.key === 'Enter' && (e.target as HTMLInputElement).blur()
        }
        style={{ padding: 0, lineHeight: 1 }}
        className={cn(
          'h-5 w-[46px] border-none bg-transparent text-center font-mono text-[11px] focus-visible:ring-0',
          errors.start ? 'text-destructive font-bold' : 'text-muted-foreground',
        )}
        placeholder="00:00"
      />

      <span className="text-muted-foreground/30 text-[10px] leading-none">
        ›
      </span>

      <Input
        disabled={disabled}
        value={localEnd}
        onChange={(e) => {
          handleTextChange(e.target.value, setLocalEnd)
          setErrors((p) => ({ ...p, end: false }))
        }}
        onBlur={() => validateAndSync(localStart, localEnd, localSpent, 'end')}
        onKeyDown={(e) =>
          e.key === 'Enter' && (e.target as HTMLInputElement).blur()
        }
        style={{ padding: 0, lineHeight: 1 }}
        className={cn(
          'h-5 w-[46px] border-none bg-transparent text-center font-mono text-[11px] focus-visible:ring-0',
          errors.end ? 'text-destructive font-bold' : 'text-muted-foreground',
        )}
        placeholder="00:00"
      />

      <div className="bg-border/40 mx-1 h-3 w-px shrink-0" />

      <Input
        disabled={disabled}
        value={localSpent}
        onChange={(e) => {
          handleTextChange(e.target.value, setLocalSpent)
          setErrors((p) => ({ ...p, spent: false }))
        }}
        onBlur={() =>
          validateAndSync(localStart, localEnd, localSpent, 'spent')
        }
        onKeyDown={(e) =>
          e.key === 'Enter' && (e.target as HTMLInputElement).blur()
        }
        style={{ padding: 0, lineHeight: 1 }}
        className={cn(
          'text-primary h-5 w-[72px] border-none bg-transparent text-center font-mono text-[11px] font-semibold focus-visible:ring-0',
          errors.spent && 'text-destructive',
          disabled && 'text-foreground/60',
        )}
        placeholder="0:00"
      />
    </div>
  )
}
