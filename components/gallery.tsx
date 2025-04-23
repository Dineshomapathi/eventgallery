"use client"

import { useState, useEffect } from "react"
import ImageModal from "./image-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ImageThumbnail from "./image-thumbnail"

interface GalleryProps {
  blockId: string
  isAdmin?: boolean
}

interface Photo {
  id: string
  publicId: string
  url: string
  thumbnailUrl: string
  timeBlock: string
  uploadedAt: string
}

const Gallery = ({ blockId, isAdmin = false }: GalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [totalPages, setTotalPages] = useState(1)

  // Extract the time block part for API query
  const getTimeBlockForQuery = () => {
    // Special case for dinner
    if (blockId === "2025-04-24-dinner" || blockId.endsWith("-dinner")) {
      return "2025-04-24-dinner"
    }

    // If it's a regular time block with date prefix
    if (blockId.includes("-") && blockId.split("-").length >= 4) {
      // Format: YYYY-MM-DD-timeBlock
      return blockId
    }

    // If it's just a date with a time block
    if (blockId.includes("-") && blockId.split("-").length === 3) {
      // It's a date without a time block specified
      return blockId
    }

    // If it's just a time block without a date
    return blockId
  }

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const timeBlockForQuery = getTimeBlockForQuery()
      console.log("Fetching photos for time block:", timeBlockForQuery)

      const response = await fetch(`/api/photos/${timeBlockForQuery}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`)
      }

      const data = await response.json()
      console.log("Received photos data:", data)

      if (data.photos) {
        setPhotos(data.photos)
        setTotalPages(Math.ceil(data.photos.length / itemsPerPage))
      }
    } catch (error) {
      console.error("Error fetching photos:", error)
      toast({
        title: "Error loading photos",
        description: "There was a problem loading the photos. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
    // Reset to first page when blockId changes
    setCurrentPage(1)
  }, [blockId])

  // Handle photo deletion
  const handlePhotoDelete = (id: string) => {
    // Remove the photo from the local state
    setPhotos((prevPhotos) => {
      const updatedPhotos = prevPhotos.filter((photo) => photo.id !== id)
      // Recalculate total pages
      setTotalPages(Math.ceil(updatedPhotos.length / itemsPerPage))
      // If current page is now empty and not the first page, go to previous page
      if (currentPage > 1 && (currentPage - 1) * itemsPerPage >= updatedPhotos.length) {
        setCurrentPage(currentPage - 1)
      }
      return updatedPhotos
    })
    // Close the modal if it's open
    setSelectedImage(null)
  }

  // Get the event name based on the blockId
  const getEventName = () => {
    if (blockId === "2025-04-24-dinner" || blockId.endsWith("-dinner")) {
      return "Networking Dinner"
    }

    if (!blockId.includes("-")) return blockId

    const parts = blockId.split("-")
    if (parts.length < 4) {
      // It's just a date
      const date = blockId
      switch (date) {
        case "2025-04-23":
          return "City Tour"
        case "2025-04-24":
          return "Conference Day 1"
        case "2025-04-25":
          return "Conference Day 2"
        default:
          return blockId
      }
    }

    // It's a date with a time block
    const date = `${parts[0]}-${parts[1]}-${parts[2]}`
    const timeBlock = parts[3]

    let eventName = ""
    switch (date) {
      case "2025-04-23":
        eventName = "City Tour"
        break
      case "2025-04-24":
        eventName = "Conference Day 1"
        break
      case "2025-04-25":
        eventName = "Conference Day 2"
        break
      default:
        eventName = date
    }

    return `${eventName}: ${timeBlock}`
  }

  // Get current page photos
  const getCurrentPagePhotos = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return photos.slice(startIndex, endIndex)
  }

  // Pagination controls
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      // Scroll to top of gallery
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      // Scroll to top of gallery
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top of gallery
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5 // Maximum number of page buttons to show

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

  const currentPagePhotos = getCurrentPagePhotos()

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-blue-800">{getEventName()}</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3] w-full h-auto rounded-lg" />
          ))}
        </div>
      ) : photos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentPagePhotos.map((photo) => (
              <ImageThumbnail
                key={photo.id}
                src={photo.thumbnailUrl || "/placeholder.svg"}
                alt={`Event photo ${photo.id}`}
                onClick={() => setSelectedImage(photo)}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
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
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground mt-2">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, photos.length)} of{" "}
            {photos.length} photos
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-100">
          <p className="text-lg text-blue-500">No photos available for this event yet.</p>
        </div>
      )}

      {selectedImage && (
        <ImageModal
          photo={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handlePhotoDelete}
          showDeleteOption={isAdmin}
        />
      )}
    </div>
  )
}

export default Gallery
