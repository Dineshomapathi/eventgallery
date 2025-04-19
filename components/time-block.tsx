"use client"

import type React from "react"
import { useMobile } from "@/hooks/use-mobile"

interface TimeBlockProps {
  id: string
  label: string
  isAccessible: boolean
  onClick: () => void
  special?: boolean
}

const TimeBlock: React.FC<TimeBlockProps> = ({ id, label, isAccessible, onClick, special = false }) => {
  const isMobile = useMobile()

  return (
    <div
      className={`
        relative border rounded-lg flex flex-col justify-center items-center cursor-pointer transition-all shadow-md w-full
        ${isMobile ? "p-3 h-24" : "p-4 h-32"}
        ${
          special
            ? "border-amber-300 hover:border-amber-400 hover:shadow-lg bg-amber-50/90 backdrop-blur-sm"
            : isAccessible
              ? "border-teal-300 hover:border-teal-400 hover:shadow-lg bg-white/90 backdrop-blur-sm"
              : "border-slate-200 bg-white/70 backdrop-blur-sm cursor-not-allowed"
        }
      `}
      onClick={onClick}
    >
      <div className="absolute top-2 right-2">
        {special ? (
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
        ) : isAccessible ? (
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
        )}
      </div>

      <div className="text-center">
        <h3
          className={`
            ${isMobile ? "text-base" : "text-lg"} 
            font-bold mb-1 
            ${special ? "text-amber-800" : !isAccessible && "text-slate-500"}
          `}
        >
          {label}
        </h3>
        <p
          className={`
            text-xs 
            ${special ? "text-amber-600" : isAccessible ? "text-teal-600" : "text-slate-400"}
          `}
        >
          {special ? "Special Event" : isAccessible ? "Available Now" : "Not Yet Available"}
        </p>
      </div>
    </div>
  )
}

export default TimeBlock
