"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Upload, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import VideoPlayer from "@/components/video-player"

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("Event Video")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch current video on mount
  useState(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch("/api/video")
        const data = await response.json()

        if (data.videoUrl) {
          setVideoUrl(data.videoUrl)
        }
        if (data.videoTitle) {
          setTitle(data.videoTitle)
        }
      } catch (error) {
        console.error("Error fetching video:", error)
      }
    }

    fetchVideo()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check if file is a video
      if (!selectedFile.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadVideo = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // First, ensure the videos table and settings columns exist
      await fetch("/api/create-videos-table", { method: "POST" })

      // Create form data
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)

      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)

          if (response.success) {
            setVideoUrl(response.videoUrl)
            toast({
              title: "Upload complete",
              description: "Video has been uploaded successfully",
            })
          } else {
            toast({
              title: "Upload failed",
              description: response.error || "An error occurred during upload",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Upload failed",
            description: `Server returned status code ${xhr.status}`,
            variant: "destructive",
          })
        }

        setUploading(false)
      })

      xhr.addEventListener("error", () => {
        toast({
          title: "Upload failed",
          description: "Network error occurred",
          variant: "destructive",
        })
        setUploading(false)
      })

      xhr.addEventListener("abort", () => {
        toast({
          title: "Upload cancelled",
          description: "The upload was cancelled",
          variant: "destructive",
        })
        setUploading(false)
      })

      xhr.open("POST", "/api/upload/video")
      xhr.send(formData)
    } catch (error) {
      console.error("Error uploading video:", error)
      toast({
        title: "Upload failed",
        description: "An error occurred during upload",
        variant: "destructive",
      })
      setUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Video Management</CardTitle>
        <CardDescription>Upload a video to display on the event gallery homepage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {videoUrl && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Current Video</h3>
            <VideoPlayer src={videoUrl} poster="/images/video-poster.jpg" className="aspect-video" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Video Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video">Video File</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="video"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 border-dashed flex flex-col items-center justify-center gap-2"
            >
              <Upload size={24} />
              <span>{file ? file.name : "Click to select video file"}</span>
            </Button>
            {file && (
              <Button type="button" variant="ghost" size="icon" onClick={clearFile} disabled={uploading}>
                <X size={20} />
              </Button>
            )}
          </div>
          {file && <p className="text-sm text-muted-foreground mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
          <AlertCircle size={18} className="text-amber-500 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Important</p>
            <p>Large video files (like 560MB) may take a long time to upload. Make sure your connection is stable.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={uploadVideo} disabled={!file || uploading} className="w-full">
          {uploading ? "Uploading..." : "Upload Video"}
        </Button>
      </CardFooter>
    </Card>
  )
}
