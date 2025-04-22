"use client"

import { useState, useEffect } from "react"
import ImageModal from "./image-modal"
import { Skeleton } from "@/components/ui/skeleton"

interface GalleryProps {
  blockId: string
}

interface Photo {
  id: string
  publicId: string
  url: string
  thumbnailUrl: string
  timeBlock: string
  uploadedAt: string
}

const Gallery = ({ blockId }: GalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
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
        }
      } catch (error) {
        console.error("Error fetching photos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [blockId])

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="aspect-[4/3] overflow-hidden rounded-lg border border-teal-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm hover:shadow-md bg-white"
              onClick={() => setSelectedImage(photo)}
            >
              <img
                src={photo.thumbnailUrl || "/placeholder.svg"}
                alt={`Event photo ${photo.id}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-100">
          <p className="text-lg text-blue-500">No photos available for this event yet.</p>
        </div>
      )}

      {selectedImage && <ImageModal photo={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  )
}

export default Gallery
