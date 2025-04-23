"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import PhotoUploader from "@/components/photo-uploader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { compressImage } from "@/lib/image-compression"

export default function AdminPage() {
  const [uploading, setUploading] = useState(false)
  const [purging, setPurging] = useState(false)
  const [testing, setTesting] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("2025-04-23")
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<string>("8-10")
  const [restrictionsDisabled, setRestrictionsDisabled] = useState<boolean>(false)
  const { toast } = useToast()

  // Add state for demo date
  const [demoDate, setDemoDate] = useState<Date>(new Date())

  // Load restrictions setting from localStorage on mount
  useEffect(() => {
    const storedRestrictionsDisabled = localStorage.getItem("restrictionsDisabled")
    if (storedRestrictionsDisabled) {
      setRestrictionsDisabled(storedRestrictionsDisabled === "true")
    }
  }, [])

  // Time blocks from 8am to 6pm in 2-hour increments
  const timeBlocks = [
    { id: "8-10", label: "8:00 - 10:00", startHour: 8 },
    { id: "10-12", label: "10:00 - 12:00", startHour: 10 },
    { id: "12-14", label: "12:00 - 2:00", startHour: 12 },
    { id: "14-16", label: "2:00 - 4:00", startHour: 14 },
    { id: "16-18", label: "4:00 - 6:00", startHour: 16 },
  ]

  // Special events
  const specialEvents = [{ id: "dinner", label: "Networking Dinner", date: "2025-04-24" }]

  // For demo purposes - set time to test different scenarios
  // Update the setDemoTime function to handle dates
  const setDemoTime = (hour: number, minute = 0, daysOffset = 0) => {
    const demoTime = new Date()

    // Add days offset if provided
    if (daysOffset !== 0) {
      demoTime.setDate(demoTime.getDate() + daysOffset)
    }

    demoTime.setHours(hour, minute, 0)
    setCurrentTime(demoTime)
    setDemoDate(demoTime)

    // Store in localStorage so the main page can access it
    localStorage.setItem("demoTime", demoTime.toISOString())
    localStorage.setItem("demoDate", demoTime.toISOString())

    toast({
      title: "Demo time set",
      description: `Current time set to ${demoTime.toLocaleString()}`,
    })
  }

  // Toggle time restrictions
  const handleToggleRestrictions = (checked: boolean) => {
    setRestrictionsDisabled(checked)
    localStorage.setItem("restrictionsDisabled", checked.toString())

    toast({
      title: checked ? "Time restrictions disabled" : "Time restrictions enabled",
      description: checked
        ? "All content is now accessible regardless of date/time"
        : "Content will only be accessible based on the event schedule",
    })
  }

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setUploading(true)

    try {
      // Compress the image before upload
      const compressedFile = await compressImage(file, 5)

      const formData = new FormData()
      formData.append("file", compressedFile)

      const response = await fetch("/api/upload/background", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server error response:", errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Background uploaded",
          description: "The background image has been uploaded successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to upload background")
      }
    } catch (error) {
      console.error("Error uploading background:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handlePurgeData = async () => {
    setPurging(true)

    try {
      const response = await fetch("/api/purge", {
        method: "POST",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server error response:", errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Data purged",
          description: `Successfully purged ${data.purged.backgrounds} backgrounds and ${data.purged.photos} photos.`,
        })
        setConfirmPurge(false)
      } else {
        throw new Error(data.error || "Failed to purge data")
      }
    } catch (error) {
      console.error("Error purging data:", error)
      toast({
        title: "Purge failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setPurging(false)
    }
  }

  const testConnections = async () => {
    setTesting(true)

    try {
      const response = await fetch("/api/test")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server error response:", errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Connections test successful",
          description: "Both Supabase and Vercel Blob connections are working correctly.",
        })
        console.log("Test results:", data)
      } else {
        if (data.supabaseError) {
          throw new Error(`Supabase connection error: ${data.supabaseError}`)
        }
        if (data.blobError) {
          throw new Error(`Blob connection error: ${data.blobError}`)
        }
        throw new Error(data.error || "Connection test failed")
      }
    } catch (error) {
      console.error("Error testing connections:", error)
      toast({
        title: "Connection test failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  // Get available time blocks based on selected date
  const getAvailableTimeBlocks = () => {
    if (selectedDate === "2025-04-24") {
      return [...timeBlocks, ...specialEvents.filter((event) => event.date === selectedDate)]
    }
    return timeBlocks
  }

  // Get event description based on selected date
  const getEventDescription = () => {
    switch (selectedDate) {
      case "2025-04-23":
        return "CITY TOUR"
      case "2025-04-24":
        return "CONFERENCE DAY 1 & NETWORKING DINNER"
      case "2025-04-25":
        return "CONFERENCE DAY 2"
      default:
        return ""
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        23rd REGIONAL OLEFINS PRODUCER TECHNICAL COMMITEE CONFERENCE - Admin
      </h1>

      <div className="mb-6">
        <Button onClick={testConnections} disabled={testing} variant="outline">
          {testing ? "Testing Connections..." : "Test Connections"}
        </Button>
      </div>

      <Tabs defaultValue="photos">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="photos">Photo Upload</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="demo-controls">Demo Controls</TabsTrigger>
          <TabsTrigger value="background">Background Upload</TabsTrigger>
          <TabsTrigger value="purge">Purge Data</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Upload Event Photos</CardTitle>
              <CardDescription>Select an event date and upload photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">1. Select Event Date</h3>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="eventDate">Event Date</Label>
                      <Select value={selectedDate} onValueChange={setSelectedDate}>
                        <SelectTrigger id="eventDate">
                          <SelectValue placeholder="Select event date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025-04-23">23RD APRIL 2025 - CITY TOUR</SelectItem>
                          <SelectItem value="2025-04-24">24TH APRIL 2025 - CONFERENCE DAY 1</SelectItem>
                          <SelectItem value="2025-04-25">25TH APRIL 2025 - CONFERENCE DAY 2</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-2">
                        Currently managing: <span className="font-semibold">{getEventDescription()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Special Event Option for April 24th */}
                  {selectedDate === "2025-04-24" && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Special Event</h3>
                      <div className="p-4 border rounded-md bg-amber-50">
                        <Label className="font-medium text-amber-800">Networking Dinner</Label>
                        <p className="text-sm text-amber-700 mt-1 mb-3">
                          Upload photos for the networking dinner event
                        </p>
                        <PhotoUploader timeBlock="2025-04-24-dinner" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Block Selection and Upload */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-3">2. Select Time Block & Upload Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div>
                      <Label className="mb-2 block">Upload Photos</Label>
                      <PhotoUploader timeBlock={`${selectedDate}-${selectedTimeBlock}`} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Settings</CardTitle>
              <CardDescription>Configure how the gallery works</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="restrictions" className="text-base">
                      Disable Time Restrictions
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Allow users to view all content regardless of the current date and time
                    </p>
                  </div>
                  <Switch id="restrictions" checked={restrictionsDisabled} onCheckedChange={handleToggleRestrictions} />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-amber-800">Note</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        {restrictionsDisabled
                          ? "Time restrictions are currently disabled. All content is accessible to users regardless of date/time."
                          : "Time restrictions are currently enabled. Content will only be accessible based on the event schedule."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo-controls">
          <Card>
            <CardHeader>
              <CardTitle>Demo Time Controls</CardTitle>
              <CardDescription>Set different times to test the time-based accessibility of blocks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="mb-2">Current Time: {currentTime.toLocaleTimeString()}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button onClick={() => setDemoTime(7, 30)} variant="outline">
                    Set to 7:30 AM
                  </Button>
                  <Button onClick={() => setDemoTime(9, 30)} variant="outline">
                    Set to 9:30 AM
                  </Button>
                  <Button onClick={() => setDemoTime(10, 30)} variant="outline">
                    Set to 10:30 AM
                  </Button>
                  <Button onClick={() => setDemoTime(14, 0)} variant="outline">
                    Set to 2:00 PM
                  </Button>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      localStorage.removeItem("demoTime")
                      setCurrentTime(new Date())
                      toast({
                        title: "Demo time reset",
                        description: "Using actual current time now",
                      })
                    }}
                  >
                    Reset to Actual Time
                  </Button>
                </div>
                <div className="pt-4 border-t mt-4">
                  <h3 className="font-medium mb-2">Demo Date Controls:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button onClick={() => setDemoTime(9, 0, -2)} variant="outline">
                      Set to 2 Days Ago
                    </Button>
                    <Button onClick={() => setDemoTime(9, 0, -1)} variant="outline">
                      Set to Yesterday
                    </Button>
                    <Button onClick={() => setDemoTime(9, 0, 0)} variant="outline">
                      Set to Today
                    </Button>
                    <Button onClick={() => setDemoTime(9, 0, 1)} variant="outline">
                      Set to Tomorrow
                    </Button>
                    <Button onClick={() => setDemoTime(9, 0, 2)} variant="outline">
                      Set to 2 Days Ahead
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background">
          <Card>
            <CardHeader>
              <CardTitle>Upload Background Image</CardTitle>
              <CardDescription>Upload a new background image for the homepage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="background">Background Image</Label>
                  <Input
                    id="background"
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Large images will be automatically compressed before upload
                  </p>
                </div>
                {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purge">
          <Card>
            <CardHeader>
              <CardTitle>Purge All Data</CardTitle>
              <CardDescription>
                Delete all backgrounds and photos from both Vercel Blob and the database. Use this before an event to
                start with a clean slate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">Warning</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      This action will permanently delete all uploaded backgrounds and photos. This cannot be undone.
                      Make sure you have backups if needed.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog open={confirmPurge} onOpenChange={setConfirmPurge}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Purge All Data</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action will permanently delete all backgrounds and photos from both Vercel Blob and the
                      database. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmPurge(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handlePurgeData} disabled={purging}>
                      {purging ? "Purging..." : "Yes, Purge Everything"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
