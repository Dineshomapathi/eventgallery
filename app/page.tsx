"use client"

import { useState, useEffect } from "react"
import TimeBlock from "@/components/time-block"
import Gallery from "@/components/gallery"
import EventSelector from "@/components/event-selector"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

export default function EventGallery() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [restrictionsDisabled, setRestrictionsDisabled] = useState<boolean>(false)
  const { toast } = useToast()
  const isMobile = useMobile()

  // Time blocks from 8am to 6pm in 2-hour increments
  const timeBlocks = [
    { id: "8-10", label: "8:00 - 10:00", startHour: 8 },
    { id: "10-12", label: "10:00 - 12:00", startHour: 10 },
    { id: "12-14", label: "12:00 - 2:00", startHour: 12 },
    { id: "14-16", label: "2:00 - 4:00", startHour: 14 },
    { id: "16-18", label: "4:00 - 6:00", startHour: 16 },
  ]

  // Check for demo time and restrictions setting in localStorage
  useEffect(() => {
    const checkSettings = () => {
      const storedDemoTime = localStorage.getItem("demoTime")
      const storedRestrictionsDisabled = localStorage.getItem("restrictionsDisabled")

      if (storedDemoTime) {
        setCurrentTime(new Date(storedDemoTime))
      } else {
        setCurrentTime(new Date())
      }

      if (storedRestrictionsDisabled) {
        setRestrictionsDisabled(storedRestrictionsDisabled === "true")
      }
    }

    // Check immediately
    checkSettings()

    // Then check every minute
    const interval = setInterval(checkSettings, 60000)

    return () => clearInterval(interval)
  }, [])

  // Update the isBlockAccessible function to check the date as well
  const isBlockAccessible = (startHour: number, eventDate: string) => {
    // If restrictions are disabled, all blocks are accessible
    if (restrictionsDisabled) {
      return true
    }

    // Handle special events
    if (eventDate.includes("-dinner")) {
      const baseDate = eventDate.split("-dinner")[0]
      const now = new Date()
      const selectedDateObj = new Date(baseDate)

      // If selected date is in the future, block is not accessible
      if (selectedDateObj > now) {
        return false
      }

      // If selected date is in the past, block is accessible
      if (selectedDateObj < now && selectedDateObj.toDateString() !== now.toDateString()) {
        return true
      }

      // If it's today, check the time (dinner is at 7pm)
      const hour = currentTime.getHours()
      return hour >= 19
    }

    // Regular time blocks
    const now = new Date()
    const selectedDateObj = new Date(eventDate)

    // If selected date is in the future, block is not accessible
    if (selectedDateObj > now) {
      return false
    }

    // If selected date is in the past, block is accessible
    if (selectedDateObj < now && selectedDateObj.toDateString() !== now.toDateString()) {
      return true
    }

    // If it's today, check the time
    const hour = currentTime.getHours()
    const minute = currentTime.getMinutes()

    // Block is accessible if current time is at least 30 minutes into the block
    return hour > startHour || (hour === startHour && minute >= 30)
  }

  // Handle block selection
  const handleBlockSelect = (blockId: string, startHour: number) => {
    if (!selectedEvent) return

    if (isBlockAccessible(startHour, selectedEvent)) {
      setSelectedBlock(blockId)
    } else {
      toast({
        title: "Block not accessible yet",
        description: "This time block will be available 30 minutes after it starts.",
        variant: "destructive",
      })
    }
  }

  // Get event description based on selected event
  const getEventDescription = () => {
    if (!selectedEvent) return ""

    if (selectedEvent.includes("-dinner")) {
      return "NETWORKING DINNER"
    }

    switch (selectedEvent) {
      case "2025-04-23":
        return "CITY TOUR"
      case "2025-04-24":
        return "CONFERENCE DAY 1"
      case "2025-04-25":
        return "CONFERENCE DAY 2"
      default:
        return ""
    }
  }

  // Handle back button
  const handleBack = () => {
    if (selectedBlock) {
      setSelectedBlock(null)
    } else if (selectedEvent) {
      setSelectedEvent(null)
    }
  }

  // Determine if we should show time blocks or the dinner event
  const showTimeBlocks = selectedEvent && !selectedEvent.includes("-dinner")
  const showDinner = selectedEvent && selectedEvent.includes("-dinner")

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/images/bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content container with fixed height sections */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Title section - fixed height */}
        <div className="w-full flex justify-center items-center pt-8 pb-4">
          <div className="w-full max-w-3xl px-4">
            <Image
              src="/images/title.png"
              alt="23rd REGIONAL OLEFINS PRODUCER TECHNICAL COMMITTEE CONFERENCE"
              width={1200}
              height={300}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Main content area - flexible height */}
        <div className="flex-grow flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-5xl">
            {/* Back button if we're in a sub-view */}
            {(selectedEvent || selectedBlock) && (
              <button
                onClick={handleBack}
                className="mb-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded hover:bg-white/90 flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to {selectedBlock ? "Time Blocks" : "Events"}
              </button>
            )}

            {/* Event selection */}
            {!selectedEvent && (
              <>
                <h2 className="text-xl font-bold mb-4 text-center text-white bg-teal-800/70 backdrop-blur-sm py-2 rounded-lg">
                  Select an Event
                </h2>
                <EventSelector selectedEvent={selectedEvent} onEventSelect={setSelectedEvent} />
              </>
            )}

            {/* Time block selection */}
            {selectedEvent && !selectedBlock && (
              <>
                <h2 className="text-xl font-bold mb-4 text-center text-white bg-teal-800/70 backdrop-blur-sm py-2 rounded-lg">
                  {getEventDescription()} - {showTimeBlocks ? "Select a Time Block" : ""}
                </h2>

                {showTimeBlocks && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {timeBlocks.map((block) => (
                      <TimeBlock
                        key={block.id}
                        id={block.id}
                        label={block.label}
                        isAccessible={isBlockAccessible(block.startHour, selectedEvent)}
                        onClick={() => handleBlockSelect(block.id, block.startHour)}
                      />
                    ))}
                  </div>
                )}

                {showDinner && (
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                    <Gallery blockId={selectedEvent} />
                  </div>
                )}
              </>
            )}

            {/* Gallery view */}
            {selectedEvent && selectedBlock && (
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                <Gallery blockId={`${selectedEvent}-${selectedBlock}`} />
              </div>
            )}
          </div>
        </div>

        {/* Footer/Sponsor section - smaller size */}
        <div className="w-full flex justify-center items-center py-3">
          <div className="w-full max-w-[180px] px-4">
            <Image
              src="/images/footer.png"
              alt="ROPTC and PETRONAS logos"
              width={180}
              height={45}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
