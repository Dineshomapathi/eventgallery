"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface ImageThumbnailProps {
  src: string
  alt: string
  onClick: () => void
}

const ImageThumbnail = ({ src, alt, onClick }: ImageThumbnailProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    // Reset states when src changes
    setIsLoading(true)
    setError(false)
    setImageSrc(null)

    // Create an intersection observer to detect when the thumbnail is in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "200px", // Start loading when within 200px of viewport
      },
    )

    // Get the current element to observe
    const element = document.getElementById(`thumbnail-${src.replace(/[^a-zA-Z0-9]/g, "-")}`)
    if (element) {
      observer.observe(element)
    }

    return () => {
      observer.disconnect()
    }
  }, [src])

  // Only load the image when it's visible
  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src)
    }
  }, [isVisible, src, imageSrc])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
  }

  return (
    <div
      id={`thumbnail-${src.replace(/[^a-zA-Z0-9]/g, "-")}`}
      className="aspect-[4/3] overflow-hidden rounded-lg border border-teal-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm hover:shadow-md bg-white relative"
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Skeleton className="w-full h-full absolute" />
        </div>
      )}

      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm p-4 text-center">
          Unable to load image
        </div>
      ) : (
        imageSrc && (
          <img
            src={imageSrc || "/placeholder.svg"}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
          />
        )
      )}
    </div>
  )
}

export default ImageThumbnail
