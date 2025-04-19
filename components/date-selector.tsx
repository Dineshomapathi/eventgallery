"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface DateOption {
  date: string
  label: string
  description: string
}

interface DateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false)

  const dateOptions: DateOption[] = [
    {
      date: "2025-04-23",
      label: "23RD APRIL 2025",
      description: "CITY TOUR",
    },
    {
      date: "2025-04-24",
      label: "24TH APRIL 2025",
      description: "CONFERENCE DAY 1 & NETWORKING DINNER",
    },
    {
      date: "2025-04-25",
      label: "25TH APRIL 2025",
      description: "CONFERENCE DAY 2",
    },
  ]

  const toggleDropdown = () => setIsOpen(!isOpen)

  const handleDateSelect = (date: string) => {
    onDateChange(date)
    setIsOpen(false)
  }

  const selectedOption = dateOptions.find((option) => option.date === selectedDate)

  return (
    <div className="relative">
      <Button
        onClick={toggleDropdown}
        variant="outline"
        className="w-full bg-white/90 backdrop-blur-sm border-teal-200 text-left flex justify-between items-center"
      >
        <div>
          <div className="font-bold">{selectedOption?.label}</div>
          <div className="text-sm text-teal-700">{selectedOption?.description}</div>
        </div>
        <Calendar className="h-4 w-4 ml-2 text-teal-600" />
      </Button>

      {isOpen && (
        <div className="absolute mt-1 w-full z-10 bg-white/95 backdrop-blur-sm rounded-md shadow-lg border border-teal-100">
          {dateOptions.map((option) => (
            <button
              key={option.date}
              className={`w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors ${
                option.date === selectedDate ? "bg-teal-100" : ""
              }`}
              onClick={() => handleDateSelect(option.date)}
            >
              <div className="font-bold">{option.label}</div>
              <div className="text-sm text-teal-700">{option.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default DateSelector
