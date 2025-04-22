"use client"

import { useEffect } from "react"
import { X, Download } from "lucide-react"
import Portal from "./portal"

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
  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  // Handle direct download of the image
  const handleDownload = () => {
    // Create a temporary anchor element
    const link = document.createElement("a")
    link.href = photo.url

    // Set download attribute with a filename
    const filename = photo.id ? `roptc-image-${photo.id}.jpg` : "roptc-image.jpg"
    link.setAttribute("download", filename)

    // Append to the body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* Controls bar */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-black/50 z-10">
          <div className="flex items-center">
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
              aria-label="Download image"
            >
              <Download size={20} className="mr-2" />
              <span>Download</span>
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
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()} // Prevent clicks on image from closing modal
          />
        </div>
      </div>
    </Portal>
  )
}

export default ImageModal
