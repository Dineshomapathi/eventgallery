"use client"

import { useEffect, useState } from "react"
import { X, Download, Maximize, Minimize } from "lucide-react"

interface Photo {
  id: string
  publicId: string
  url: string
  thumbnailUrl: string
  timeBlock: string
  uploadedAt: string
}

interface ImageModalProps {
  photo: Photo
  onClose: () => void
}

const ImageModal = ({ photo, onClose }: ImageModalProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          exitFullscreen()
        } else {
          onClose()
        }
      }
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose, isFullscreen])

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  // Handle download (HD version)
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = photo.url
    link.download = photo.id || "roptc-image.jpg"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const element = document.documentElement
      if (element.requestFullscreen) {
        element.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      exitFullscreen()
    }
  }

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
    setIsFullscreen(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-white hover:text-teal-300 z-10"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="absolute top-0 left-0 p-2 text-white hover:text-teal-300 z-10 flex items-center"
          aria-label="Download image"
        >
          <Download size={20} className="mr-1" />
          <span>Download</span>
        </button>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-0 left-32 p-2 text-white hover:text-teal-300 z-10 flex items-center"
          aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
        >
          {isFullscreen ? (
            <>
              <Minimize size={20} className="mr-1" />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize size={20} className="mr-1" />
              <span>Fullscreen</span>
            </>
          )}
        </button>

        {/* Image */}
        <div className={`max-h-[80vh] max-w-full overflow-auto ${isFullscreen ? "h-screen w-screen" : ""}`}>
          <img
            src={photo.url || "/placeholder.svg"}
            alt="Enlarged event image"
            className={`max-w-full max-h-full object-contain ${isFullscreen ? "w-screen h-screen" : ""}`}
          />
        </div>
      </div>
    </div>
  )
}

export default ImageModal
