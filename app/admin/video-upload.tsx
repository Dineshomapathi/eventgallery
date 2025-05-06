"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, AlertTriangle, Info } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function VideoUpload() {
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [progress, setProgress] = useState(0)
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null)
  const [currentVideo, setCurrentVideo] = useState<{ url: string; title: string } | null>(null)
  const [loadingCurrentVideo, setLoadingCurrentVideo] = useState(true)
  const [setupError, setSetupError] = useState<string | null>(null)
  const progressRef = useRef(0)
  const { toast } = useToast()

  // Fetch current video information
  useEffect(() => {
    const setupVideoFields = async () => {
      try {
        setLoadingCurrentVideo(true)
        setSetupError(null)

        // First, ensure the video fields exist in the settings table
        try {
          const setupResponse = await fetch("/api/create-video-fields", {
            method: "POST",
          })

          if (!setupResponse.ok) {
            console.error("Failed to set up video fields")
            // Don't set error yet, try direct approach
          }
        } catch (setupError) {
          console.error("Error calling create-video-fields API:", setupError)
          // Continue with direct approach
        }

        // Direct approach to get settings
        try {
          const { data, error } = await supabase
            .from("settings")
            .select("video_url, video_title")
            .eq("id", "global")
            .single()

          if (!error && data) {
            if (data.video_url) {
              setCurrentVideo({
                url: data.video_url,
                title: data.video_title || "Event Video",
              })
            }
          }
        } catch (directError) {
          console.error("Error with direct settings fetch:", directError)
          setSetupError("Could not retrieve current video information. Please try refreshing the page.")
        }
      } catch (error) {
        console.error("Error setting up video functionality:", error)
        setSetupError("Failed to set up video functionality. Please try refreshing the page.")
      } finally {
        setLoadingCurrentVideo(false)
      }
    }

    setupVideoFields()
  }, [])

  // Update progress display
  const updateProgress = () => {
    if (progressRef.current !== progress) {
      setProgress(progressRef.current)
      requestAnimationFrame(updateProgress)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null)
      setFileSizeWarning(null)
      return
    }

    const selectedFile = e.target.files[0]
    setFile(selectedFile)

    // Check file size and show warning if it's large
    const fileSizeMB = selectedFile.size / 1024 / 1024
    if (fileSizeMB > 600) {
      setFileSizeWarning(`File size (${fileSizeMB.toFixed(2)}MB) exceeds the 600MB limit.`)
    } else if (fileSizeMB > 200) {
      setFileSizeWarning(`Large file (${fileSizeMB.toFixed(2)}MB). Upload may take a while and could time out.`)
    } else {
      setFileSizeWarning(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the video",
        variant: "destructive",
      })
      return
    }

    // Check file size
    const fileSizeMB = file.size / 1024 / 1024
    if (fileSizeMB > 600) {
      toast({
        title: "File too large",
        description: "Maximum file size is 600MB. Please select a smaller file.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    progressRef.current = 0
    setProgress(0)
    requestAnimationFrame(updateProgress)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)

      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()
      xhr.open("POST", "/api/upload/video")

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          progressRef.current = Math.round((event.loaded / event.total) * 100)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)

          if (response.success) {
            toast({
              title: "Upload complete",
              description: "Video has been uploaded successfully",
            })

            // Update current video
            setCurrentVideo({
              url: response.url,
              title: response.title,
            })

            // Reset form
            setFile(null)
            setTitle("")
            setFileSizeWarning(null)

            // Reset file input
            const fileInput = document.getElementById("video-file") as HTMLInputElement
            if (fileInput) fileInput.value = ""
          } else {
            throw new Error(response.error || "Failed to upload video")
          }
        } else {
          throw new Error(`HTTP Error: ${xhr.status}`)
        }
        setUploading(false)
      }

      xhr.onerror = () => {
        toast({
          title: "Upload failed",
          description: "There was a network error during upload",
          variant: "destructive",
        })
        setUploading(false)
      }

      xhr.send(formData)
    } catch (error) {
      console.error("Error uploading video:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      setUploading(false)
    }
  }

  // Calculate estimated upload time based on file size
  const getEstimatedUploadTime = () => {
    if (!file) return null

    const fileSizeMB = file.size / 1024 / 1024
    // Assume average upload speed of 1MB/s (conservative estimate)
    const estimatedMinutes = Math.ceil(fileSizeMB / 60)

    return estimatedMinutes > 1
      ? `Estimated upload time: ~${estimatedMinutes} minutes`
      : "Estimated upload time: Less than a minute"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Event Video</CardTitle>
        <CardDescription>
          Upload a video to be displayed on the homepage. The video will replace any previously uploaded video.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingCurrentVideo ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <p>Checking current video status...</p>
          </div>
        ) : setupError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{setupError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Video Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Current Video Status</h3>
                  {currentVideo ? (
                    <div className="text-sm text-blue-700 mt-1">
                      <p>
                        <strong>Title:</strong> {currentVideo.title}
                      </p>
                      <p className="mt-1">
                        <strong>URL:</strong>{" "}
                        <a href={currentVideo.url} target="_blank" rel="noopener noreferrer" className="underline">
                          {currentVideo.url.substring(0, 50)}...
                        </a>
                      </p>
                      <p className="mt-2">Uploading a new video will replace this one.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-700 mt-1">No video has been uploaded yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="video-title">Video Title</Label>
                <Input
                  id="video-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for the video"
                  disabled={uploading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="video-file">Video File</Label>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: MP4, WebM, Ogg. Maximum size: 600MB.
                </p>
              </div>

              {fileSizeWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                    <p className="text-sm text-amber-700">{fileSizeWarning}</p>
                  </div>
                </div>
              )}

              {file && (
                <div className="text-sm">
                  <p>Selected file: {file.name}</p>
                  <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {file.size > 50 * 1024 * 1024 && <p className="text-muted-foreground">{getEstimatedUploadTime()}</p>}
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center">{progress}% uploaded</p>
                  {progress > 0 && progress < 100 && (
                    <p className="text-xs text-center text-muted-foreground">
                      Please keep this window open until the upload completes
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleUpload} disabled={uploading || !file} className="w-full">
                {uploading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Upload Video
                  </>
                )}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Tips for Large Videos</h3>
                    <ul className="text-sm text-blue-700 mt-1 list-disc pl-5">
                      <li>For videos larger than 200MB, consider compressing them first</li>
                      <li>Keep this browser tab open during the entire upload process</li>
                      <li>Ensure you have a stable internet connection</li>
                      <li>If upload fails, try breaking the video into smaller segments</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
