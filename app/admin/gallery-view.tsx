"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RefreshCw, Download, Calendar, Info } from "lucide-react"
import ImageThumbnail from "@/components/image-thumbnail"
import ImageModal from "@/components/image-modal"
import { useToast } from "@/hooks/use-toast"
import { downloadAllPhotosAsZip, countTotalPhotosForDay } from "@/lib/zip-utils"

interface Photo {
  id: string
  publicId: string
  url: string
  thumbnailUrl: string
  timeBlock: string
  uploadedAt: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminGalleryView() {
  const [selectedDate, setSelectedDate] = useState<string>("2025-04-23")
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<string>("8-10")
  const [viewSpecialEvent, setViewSpecialEvent] = useState<boolean>(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingDay, setIsDownloadingDay] = useState(false)
  const [totalDayPhotos, setTotalDayPhotos] = useState<number>(0)
  const { toast } = useToast()

  // Always allow downloads in admin view
  const isAdmin = true

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
  const getGalleryBlockId = useCallback(() => {
    if (selectedDate === "2025-04-24" && viewSpecialEvent) {
      return "2025-04-24-dinner"
    }
    return `${selectedDate}-${selectedTimeBlock}`
  }, [selectedDate, selectedTimeBlock, viewSpecialEvent])

  // Count total photos for the day
  const fetchTotalDayPhotos = useCallback(async () => {
    const count = await countTotalPhotosForDay(selectedDate)
    setTotalDayPhotos(count)
  }, [selectedDate])

  // Fetch photos for the current page
  const fetchPhotos = useCallback(
    async (page = 1) => {
      try {
        setLoading(true)
        setError(null)
        const blockId = getGalleryBlockId()
        console.log(`Admin: Fetching photos for block: ${blockId}, page: ${page}`)

        // Use a larger page size for admin view
        const response = await fetch(`/api/photos/${blockId}?page=${page}&limit=24`)

        if (!response.ok) {
          throw new Error(`Failed to fetch photos: ${response.status}`)
        }

        const data = await response.json()
        console.log("Admin: Received photos data:", data)

        if (data.photos) {
          setPhotos(data.photos)
          if (data.pagination) {
            setPaginationInfo(data.pagination)
          }
        }
      } catch (error) {
        console.error("Error fetching photos:", error)
        setError("Failed to load photos. Please try again.")
        toast({
          title: "Error loading photos",
          description: "There was a problem loading the photos. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [selectedDate, selectedTimeBlock, viewSpecialEvent, getGalleryBlockId, toast],
  )

  // Load photos when selection changes
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when selection changes
    fetchPhotos(1)
    fetchTotalDayPhotos()
  }, [selectedDate, selectedTimeBlock, viewSpecialEvent, fetchPhotos, fetchTotalDayPhotos])

  // Handle photo deletion
  const handlePhotoDelete = (id: string) => {
    // Remove the photo from the local state
    setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id))

    // Update pagination info
    if (paginationInfo) {
      const newTotal = paginationInfo.total - 1
      setPaginationInfo({
        ...paginationInfo,
        total: newTotal,
        totalPages: Math.ceil(newTotal / paginationInfo.limit),
      })

      // If we deleted the last photo on the current page and it's not the first page,
      // go back to the previous page
      if (photos.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1)
        fetchPhotos(currentPage - 1)
      } else if (photos.length === 1) {
        // If it was the last photo on the first page, just refresh
        fetchPhotos(1)
      }
    }

    // Close the modal if it's open
    setSelectedImage(null)
  }

  // Handle download all photos
  const handleDownloadAll = async () => {
    if (!paginationInfo || paginationInfo.total === 0 || isDownloading) return

    setIsDownloading(true)
    try {
      const blockId = getGalleryBlockId()
      const success = await downloadAllPhotosAsZip(blockId, paginationInfo.total)

      if (success) {
        toast({
          title: "Download complete",
          description: `Successfully downloaded ${paginationInfo.total} photos as a zip file.`,
        })
      }
    } catch (error) {
      console.error("Error downloading all photos:", error)
      toast({
        title: "Download failed",
        description: "There was a problem downloading the photos. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle download all photos from day
  const handleDownloadAllFromDay = async () => {
    if (totalDayPhotos === 0 || isDownloadingDay) return

    setIsDownloadingDay(true)
    try {
      const success = await downloadAllPhotosAsZip(selectedDate, totalDayPhotos, true)

      if (success) {
        toast({
          title: "Download complete",
          description: `Successfully downloaded all ${totalDayPhotos} photos from the day as a zip file.`,
        })
      }
    } catch (error) {
      console.error("Error downloading all photos from day:", error)
      toast({
        title: "Download failed",
        description: "There was a problem downloading the photos. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingDay(false)
    }
  }

  // Pagination controls
  const goToNextPage = () => {
    if (paginationInfo && currentPage < paginationInfo.totalPages) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchPhotos(nextPage)
      // Scroll to top of gallery
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1
      setCurrentPage(prevPage)
      fetchPhotos(prevPage)
      // Scroll to top of gallery
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPage = (page: number) => {
    if (paginationInfo && page >= 1 && page <= paginationInfo.totalPages) {
      setCurrentPage(page)
      fetchPhotos(page)
      // Scroll to top of gallery
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!paginationInfo) return []

    const pageNumbers = []
    const maxVisiblePages = 5 // Maximum number of page buttons to show
    const totalPages = paginationInfo.totalPages

    if (totalPages <= maxVisiblePages) {
      // If we have fewer pages than the max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      // Calculate start and end of the middle section
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("...")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }

      // Always include last page if not already included
      if (totalPages > 1) {
        pageNumbers.push(totalPages)
      }
    }

    return pageNumbers
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{getEventDescription()}</h2>

              {/* Show download buttons */}
              <div className="flex items-center">
                {/* Download all photos from time block button */}
                {paginationInfo && paginationInfo.total > 0 && (
                  <Button
                    onClick={handleDownloadAll}
                    disabled={isDownloading || isDownloadingDay}
                    variant="outline"
                    size="sm"
                    className="flex items-center mr-2"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw size={14} className="mr-1.5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={14} className="mr-1.5" />
                        Download Block
                      </>
                    )}
                  </Button>
                )}

                {/* Download all photos from day button */}
                {totalDayPhotos > 0 && (
                  <Button
                    onClick={handleDownloadAllFromDay}
                    disabled={isDownloading || isDownloadingDay}
                    variant="outline"
                    size="sm"
                    className="flex items-center mr-2"
                  >
                    {isDownloadingDay ? (
                      <>
                        <RefreshCw size={14} className="mr-1.5 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Calendar size={14} className="mr-1.5" />
                        Download Day ({totalDayPhotos})
                      </>
                    )}
                  </Button>
                )}

                {paginationInfo && paginationInfo.total > 0 && (
                  <div className="text-sm text-gray-600 flex items-center">
                    <Info size={14} className="mr-1.5" />
                    Total: {paginationInfo.total} photos
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-[4/3] w-full h-auto rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-red-100">
                <p className="text-lg text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={() => fetchPhotos(currentPage)} className="flex items-center">
                  <RefreshCw size={16} className="mr-2" />
                  Try Again
                </Button>
              </div>
            ) : photos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <ImageThumbnail
                      key={photo.id}
                      src={photo.thumbnailUrl || "/placeholder.svg"}
                      alt={`Event photo ${photo.id}`}
                      onClick={() => setSelectedImage(photo)}
                    />
                  ))}
                </div>

                {/* Pagination controls */}
                {paginationInfo && paginationInfo.totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getPageNumbers().map((page, index) =>
                      typeof page === "number" ? (
                        <Button
                          key={index}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className="min-w-[2.5rem]"
                        >
                          {page}
                        </Button>
                      ) : (
                        <span key={index} className="px-2">
                          ...
                        </span>
                      ),
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!paginationInfo || currentPage === paginationInfo.totalPages}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground mt-2">
                  {paginationInfo && (
                    <>
                      Showing {(currentPage - 1) * paginationInfo.limit + 1}-
                      {Math.min(currentPage * paginationInfo.limit, paginationInfo.total)} of {paginationInfo.total}{" "}
                      photos
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-100">
                <p className="text-lg text-blue-500">No photos available for this event yet.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {selectedImage && (
        <ImageModal
          photo={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handlePhotoDelete}
          showDeleteOption={true}
        />
      )}
    </Card>
  )
}
