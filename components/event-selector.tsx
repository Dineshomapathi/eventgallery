"use client"

import type React from "react"
import { useMobile } from "@/hooks/use-mobile"

interface EventOption {
  date: string
  label: string
  description: string
  special?: boolean
}

interface EventSelectorProps {
  selectedEvent: string | null
  onEventSelect: (event: string) => void
}

const EventSelector: React.FC<EventSelectorProps> = ({ selectedEvent, onEventSelect }) => {
  const isMobile = useMobile()

  const eventOptions: EventOption[] = [
    {
      date: "2025-04-23",
      label: "23RD APRIL 2025",
      description: "CITY TOUR",
    },
    {
      date: "2025-04-24",
      label: "24TH APRIL 2025",
      description: "CONFERENCE DAY 1",
    },
    {
      date: "2025-04-24-dinner",
      label: "24TH APRIL 2025",
      description: "NETWORKING DINNER",
      special: true,
    },
    {
      date: "2025-04-25",
      label: "25TH APRIL 2025",
      description: "CONFERENCE DAY 2",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {eventOptions.map((option) => (
        <div
          key={option.date}
          className={`
            relative border rounded-lg p-4 cursor-pointer transition-all shadow-md
            ${
              option.special
                ? "border-amber-300 hover:border-amber-400 hover:shadow-lg bg-amber-50/90 backdrop-blur-sm"
                : "border-teal-300 hover:border-teal-400 hover:shadow-lg bg-white/90 backdrop-blur-sm"
            }
            ${selectedEvent === option.date ? "ring-2 ring-offset-2 ring-teal-500" : ""}
          `}
          onClick={() => onEventSelect(option.date)}
        >
          <div className="text-center py-3">
            <h3 className={`text-lg font-bold mb-1 ${option.special ? "text-amber-800" : "text-teal-800"}`}>
              {option.label}
            </h3>
            <p className={`text-sm ${option.special ? "text-amber-600" : "text-teal-600"} font-medium`}>
              {option.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default EventSelector
