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
      } else if ((element as any).mozRequestFullScreen) {
        ;(element as any).mozRequestFullScreen()
      } else if ((element as any).webkitRequestFullscreen) {
        ;(element as any).webkitRequestFullscreen()
      } else if ((element as any).msRequestFullscreen) {
        ;(element as any).msRequestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      exitFullscreen()
    }
  }

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      ;(document as any).mozCancelFullScreen()
    } else if ((document as any).webkitExitFullscreen) {
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).msExitFullscreen) {
      ;(document as any).msExitFullscreen()
    }
    setIsFullscreen(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Controls bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-black/50 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
            aria-label="Download image"
          >
            <Download size={20} className="mr-2" />
            <span>Download</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize size={20} className="mr-2" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize size={20} className="mr-2" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-white hover:text-teal-300 bg-black/50 rounded-full"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      {/* Image container - takes up the full viewport */}
      <div className="w-full h-full flex items-center justify-center p-4 pt-16">
        <img
          src={photo.url || "/placeholder.svg"}
          alt="Enlarged event image"
          className={`max-w-full max-h-full object-contain ${isFullscreen ? "w-screen h-screen" : ""}`}
          onClick={(e) => e.stopPropagation()} // Prevent clicks on image from closing modal
        />
      </div>
    </div>
  )
}

export default ImageModal
