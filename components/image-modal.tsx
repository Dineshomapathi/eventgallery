"use client"

import { useEffect, useState } from "react"
import { X, Download } from "lucide-react"
import Portal from "./portal"
import { downloadFile } from "@/lib/download-utils"

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
  const [downloading, setDownloading] = useState(false)

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

  // Handle direct download of the image for both mobile and desktop
  const handleDownload = async () => {
    try {
      setDownloading(true)

      // Generate a filename based on the photo ID or a default
      const filename = photo.id ? `roptc-image-${photo.id}.jpg` : "roptc-image.jpg"

      // Use our utility function to download the file
      const success = await downloadFile(photo.url, filename)

      if (!success) {
        console.warn("Couldn't download using preferred method, falling back to direct link")
        // Fallback to direct link as last resort
        window.open(photo.url, "_blank")
      }
    } catch (error) {
      console.error("Error downloading image:", error)
    } finally {
      setDownloading(false)
    }
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
              disabled={downloading}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors disabled:opacity-50"
              aria-label="Download image"
            >
              <Download size={20} className="mr-2" />
              <span>{downloading ? "Downloading..." : "Download"}</span>
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
