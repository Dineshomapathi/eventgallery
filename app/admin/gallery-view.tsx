"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Gallery from "@/components/gallery"

export default function AdminGalleryView() {
  const [selectedDate, setSelectedDate] = useState<string>("2025-04-23")
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<string>("8-10")
  const [viewSpecialEvent, setViewSpecialEvent] = useState<boolean>(false)

  // Time blocks from 8am to 6pm in 2-hour increments
  const timeBlocks = [
    { id: "8-10", label: "8:00 - 10:00" },
    { id: "10-12", label: "10:00 - 12:00" },
    { id: "12-14", label: "12:00 - 2:00" },
    { id: "14-16", label: "2:00 - 4:00" },
    { id: "16-18", label: "4:00 - 6:00" },
  ]

  // Get event description based on selected date
  const getEventDescription = () => {
    switch (selectedDate) {
      case "2025-04-23":
        return "CITY TOUR"
      case "2025-04-24":
        return viewSpecialEvent ? "NETWORKING DINNER" : "CONFERENCE DAY 1"
      case "2025-04-25":
        return "CONFERENCE DAY 2"
      default:
        return ""
    }
  }

  // Get the gallery block ID based on selections
  const getGalleryBlockId = () => {
    if (selectedDate === "2025-04-24" && viewSpecialEvent) {
      return "2025-04-24-dinner"
    }
    return `${selectedDate}-${selectedTimeBlock}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Gallery Photos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date and Time Block Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="eventDate" className="mb-2 block">
                Event Date
              </Label>
              <Select
                value={selectedDate}
                onValueChange={(value) => {
                  setSelectedDate(value)
                  setViewSpecialEvent(false)
                }}
              >
                <SelectTrigger id="eventDate">
                  <SelectValue placeholder="Select event date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-04-23">23RD APRIL 2025 - CITY TOUR</SelectItem>
                  <SelectItem value="2025-04-24">24TH APRIL 2025 - CONFERENCE DAY 1</SelectItem>
                  <SelectItem value="2025-04-25">25TH APRIL 2025 - CONFERENCE DAY 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDate === "2025-04-24" && (
              <div>
                <Label htmlFor="eventType" className="mb-2 block">
                  Event Type
                </Label>
                <Select
                  value={viewSpecialEvent ? "dinner" : "conference"}
                  onValueChange={(value) => {
                    setViewSpecialEvent(value === "dinner")
                  }}
                >
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="dinner">Networking Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!viewSpecialEvent && (
              <div>
                <Label htmlFor="timeBlock" className="mb-2 block">
                  Time Block
                </Label>
                <Select value={selectedTimeBlock} onValueChange={setSelectedTimeBlock}>
                  <SelectTrigger id="timeBlock">
                    <SelectValue placeholder="Select time block" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeBlocks.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Gallery View */}
          <div className="mt-6 p-4 bg-white rounded-lg border">
            <h2 className="text-xl font-bold mb-4">{getEventDescription()}</h2>
            <Gallery blockId={getGalleryBlockId()} isAdmin={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
