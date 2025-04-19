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

  // Extract the time block part (after the date)
  const timeBlockPart =
    blockId.includes("-") && !blockId.endsWith("-dinner") ? blockId.split("-").slice(-1)[0] : blockId

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/photos/${timeBlockPart}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch photos: ${response.status}`)
        }

        const data = await response.json()

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
  }, [timeBlockPart])

  // Get the event name based on the blockId
  const getEventName = () => {
    if (blockId.endsWith("-dinner")) {
      return "Networking Dinner"
    }

    if (!blockId.includes("-")) return timeBlockPart

    const parts = blockId.split("-")
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
