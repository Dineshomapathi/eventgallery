"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Upload, RefreshCw, CheckCircle, Video, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface VideoData {
  id: string
  title: string
  description: string
  url: string
  file_path: string
  size_in_bytes: number
  mime_type: string
  created_at: string
  duration_in_seconds: number | null
  thumbnail_url: string | null
}

export default function VideoUploader() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [title, setTitle] = useState("Event Video")
  const [description, setDescription] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch current video on component mount
  useEffect(() => {
    fetchCurrentVideo()
  }, [])

  const fetchCurrentVideo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/videos", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.video) {
        setCurrentVideo(data.video)
      } else {
        setCurrentVideo(null)
      }
    } catch (error) {
      console.error("Error fetching video:", error)
      setError("Failed to load current video")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to upload a video in chunks
  const uploadVideoInChunks = async (file: File) => {
    const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const fileId = Date.now().toString() // Unique ID for this upload
    const fileName = `${fileId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`

    setProgress(0)
    setError(null)
    setUploading(true)

    try {
      // Step 1: Initialize the upload
      const initResponse = await fetch("/api/upload/video/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          fileSize: file.size,
          mimeType: file.type,
          totalChunks,
          title,
          description,
        }),
      })

      if (!initResponse.ok) {
        const errorData = await initResponse.json()
        throw new Error(errorData.error || "Failed to initialize upload")
      }

      const initData = await initResponse.json()
      const uploadId = initData.uploadId

      // Step 2: Upload each chunk
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        const formData = new FormData()
        formData.append("chunk", chunk)
        formData.append("uploadId", uploadId)
        formData.append("chunkIndex", chunkIndex.toString())
        formData.append("totalChunks", totalChunks.toString())

        const chunkResponse = await fetch("/api/upload/video/chunk", {
          method: "POST",
          body: formData,
        })

        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json()
          throw new Error(errorData.error || `Failed to upload chunk ${chunkIndex + 1}`)
        }

        // Update progress
        setProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100))
      }

      // Step 3: Complete the upload
      const completeResponse = await fetch("/api/upload/video/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId,
          fileName,
          fileSize: file.size,
          mimeType: file.type,
          title,
          description,
        }),
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || "Failed to complete upload")
      }

      const completeData = await completeResponse.json()

      toast({
        title: "Video uploaded successfully",
        description: "Your video has been uploaded and is now available",
      })

      // Fetch the updated video
      await fetchCurrentVideo()

      return completeData
    } catch (error) {
      console.error("Error uploading video:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    // Check file size (max 600MB)
    if (file.size > 600 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 600MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      })
      return
    }

    try {
      await uploadVideoInChunks(file)
    } catch (error) {
      console.error("Error uploading video:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDeleteVideo = async () => {
    if (!currentVideo) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/videos/${currentVideo.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Video deleted",
          description: "The video has been successfully deleted",
        })
        setCurrentVideo(null)
      } else {
        throw new Error(data.error || "Failed to delete video")
      }
    } catch (error) {
      console.error("Error deleting video:", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Current video display */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Current Video</h3>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 bg-slate-100 rounded-md">
            <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
          </div>
        ) : currentVideo ? (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-md border">
              <h4 className="font-medium">{currentVideo.title}</h4>
              {currentVideo.description && <p className="text-sm text-slate-600 mt-1">{currentVideo.description}</p>}
              <div className="mt-2 text-xs text-slate-500">
                <p>Uploaded: {new Date(currentVideo.created_at).toLocaleString()}</p>
                <p>Size: {formatFileSize(currentVideo.size_in_bytes)}</p>
                <p>Type: {currentVideo.mime_type}</p>
              </div>
            </div>

            <video
              src={currentVideo.url}
              controls
              className="w-full max-w-2xl rounded-md shadow-sm"
              poster={currentVideo.thumbnail_url || undefined}
            />

            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Video
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 bg-slate-100 rounded-md">
            <Video className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-slate-500">No video has been uploaded yet</p>
          </div>
        )}
      </div>

      {/* Upload new video */}
      <div>
        <h3 className="text-lg font-medium mb-3">Upload New Video</h3>

        <div className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="video-title">Title</Label>
              <Input
                id="video-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="video-description">Description (optional)</Label>
              <Textarea
                id="video-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                disabled={uploading}
              />
            </div>
          </div>

          <input
            type="file"
            id="video-upload"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={uploading}
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center"
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Select Video File"}
          </Button>

          <p className="text-sm text-muted-foreground">Maximum file size: 600MB. Supported formats: MP4, WebM, MOV.</p>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">Please don't close this page while the video is uploading</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
                <Button variant="link" className="p-0 h-auto text-xs text-red-700" onClick={fetchCurrentVideo}>
                  Retry loading current video
                </Button>
              </div>
            </div>
          )}

          {!error && !uploading && progress === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <p className="text-sm text-green-800">Video uploaded successfully!</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The video will be permanently removed from the gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVideo} className="bg-red-600 hover:bg-red-700">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
