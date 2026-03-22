"use client"

import * as React from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
  isWithinInterval,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface DateRange {
  from: Date
  to: Date | null
}

interface DateRangeCalendarProps {
  value: DateRange | null
  onChange: (range: DateRange | null) => void
}

export function DateRangeCalendar({ value, onChange }: DateRangeCalendarProps) {
  const [viewDate, setViewDate] = React.useState(() => value?.from ?? new Date())
  const [selecting, setSelecting] = React.useState<"from" | "to">("from")
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null)

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function handleDayClick(day: Date) {
    if (selecting === "from") {
      onChange({ from: day, to: null })
      setSelecting("to")
    } else {
      if (value?.from && isBefore(day, value.from)) {
        onChange({ from: day, to: null })
        setSelecting("to")
      } else {
        onChange({ from: value!.from, to: day })
        setSelecting("from")
      }
    }
  }

  function isInRange(day: Date) {
    if (!value?.from) return false
    const end = value.to ?? hoveredDate
    if (!end) return false
    const rangeStart = isBefore(end, value.from) ? end : value.from
    const rangeEnd = isAfter(end, value.from) ? end : value.from
    return isWithinInterval(day, { start: rangeStart, end: rangeEnd })
  }

  function isRangeStart(day: Date) {
    return value?.from ? isSameDay(day, value.from) : false
  }

  function isRangeEnd(day: Date) {
    return value?.to ? isSameDay(day, value.to) : false
  }

  const presets = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 14 days", days: 14 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-sm font-medium">
          {format(viewDate, "MMMM yyyy")}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground font-medium">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewDate)
          const selected = isRangeStart(day) || isRangeEnd(day)
          const inRange = isInRange(day)
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
              className={cn(
                "h-7 w-full text-xs transition-colors relative",
                !inMonth && "text-muted-foreground/40",
                inMonth && "text-foreground hover:bg-accent",
                inRange && !selected && "bg-accent/60",
                selected && "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold",
                isToday && !selected && "font-semibold text-primary",
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>

      <div className="border-t pt-2 space-y-1">
        <p className="text-[11px] text-muted-foreground font-medium px-1">Quick select</p>
        <div className="grid grid-cols-2 gap-1">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="xs"
              className="justify-start text-xs"
              onClick={() => {
                const to = new Date()
                const from = new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000)
                onChange({ from, to })
                setSelecting("from")
                setViewDate(from)
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {value && (
        <div className="border-t pt-2">
          <Button
            variant="ghost"
            size="xs"
            className="w-full text-xs text-muted-foreground"
            onClick={() => {
              onChange(null)
              setSelecting("from")
            }}
          >
            Clear date range
          </Button>
        </div>
      )}
    </div>
  )
}
