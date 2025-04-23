"use client"

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface ImageThumbnailProps {
  src: string
  alt: string
  onClick: () => void
}

const ImageThumbnail = ({ src, alt, onClick }: ImageThumbnailProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
  }

  return (
    <div
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
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}

export default ImageThumbnail
