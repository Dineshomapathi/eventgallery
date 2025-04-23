"use client"

import { useEffect, useState } from "react"
import { X, Download, Trash2 } from "lucide-react"
import Portal from "./portal"
import { downloadFile } from "@/lib/download-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

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
  onDelete?: (id: string) => void
  showDeleteOption?: boolean
}

const ImageModal = ({ photo, onClose, onDelete, showDeleteOption = false }: ImageModalProps) => {
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { toast } = useToast()

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
      toast({
        title: "Download failed",
        description: "There was a problem downloading the image.",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  // Handle delete confirmation
  const confirmDelete = () => {
    setShowDeleteConfirm(true)
  }

  // Handle actual deletion
  const handleDelete = async () => {
    try {
      setDeleting(true)

      const response = await fetch("/api/photos/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: photo.id,
          url: photo.url,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete photo")
      }

      toast({
        title: "Photo deleted",
        description: "The photo has been successfully deleted.",
      })

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(photo.id)
      }

      // Close the modal
      onClose()
    } catch (error) {
      console.error("Error deleting photo:", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete the photo",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
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
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={downloading || !imageLoaded}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors disabled:opacity-50"
              aria-label="Download image"
            >
              <Download size={20} className="mr-2" />
              <span>{downloading ? "Downloading..." : "Download"}</span>
            </button>

            {showDeleteOption && (
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                aria-label="Delete image"
              >
                <Trash2 size={20} className="mr-2" />
                <span>{deleting ? "Deleting..." : "Delete"}</span>
              </button>
            )}
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
          {/* Loading indicator */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <img
            src={photo.url || "/placeholder.svg"}
            alt="Enlarged event image"
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => e.stopPropagation()} // Prevent clicks on image from closing modal
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this photo?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The photo will be permanently removed from the gallery.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Portal>
  )
}

export default ImageModal
