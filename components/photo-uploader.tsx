"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { compressImage, uploadWithProgress } from "@/lib/image-utils"
import { Loader2, Upload, X } from "lucide-react"

interface PhotoUploaderProps {
  timeBlock: string
  onSuccess?: () => void
}

export default function PhotoUploader({ timeBlock, onSuccess }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const progressRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  // Update progress display
  const updateProgress = () => {
    if (progressRef.current !== progress) {
      setProgress(progressRef.current)
      requestAnimationFrame(updateProgress)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)

    // Create previews
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file))
    setPreviews(newPreviews)
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    const newPreviews = [...previews]

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index])

    newFiles.splice(index, 1)
    newPreviews.splice(index, 1)

    setFiles(newFiles)
    setPreviews(newPreviews)
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    progressRef.current = 0
    setProgress(0)
    requestAnimationFrame(updateProgress)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Show which file is being processed
        toast({
          title: `Processing file ${i + 1} of ${files.length}`,
          description: file.name,
        })

        // Compress the image before upload (max 5MB)
        const compressedFile = await compressImage(file, 5)

        // Calculate compression ratio for feedback
        const compressionRatio = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1)
        console.log(
          `Compressed ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`,
        )

        // Upload with progress tracking
        const response = await uploadWithProgress(progressRef, compressedFile, "/api/upload/photos", { timeBlock })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }
      }

      // Clean up previews
      previews.forEach(URL.revokeObjectURL)

      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${files.length} photo(s)`,
      })

      // Reset state
      setFiles([])
      setPreviews([])

      // Call success callback if provided
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error uploading photos:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="photos" className="mb-2 block">
          {files.length > 0 ? `${files.length} file(s) selected` : "Upload Photos (Multiple)"}
        </Label>

        {files.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview || "/placeholder.svg"}
                  alt={`Preview ${index}`}
                  className="h-24 w-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
                <p className="text-xs mt-1 truncate">{files[index].name}</p>
                <p className="text-xs text-muted-foreground">{(files[index].size / 1024 / 1024).toFixed(2)}MB</p>
              </div>
            ))}
          </div>
        ) : (
          <Input id="photos" type="file" accept="image/*" multiple onChange={handleFileChange} disabled={uploading} />
        )}

        {uploading && (
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center mt-1">{progress}% complete</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {files.length > 0 && (
          <>
            <Button onClick={handleUpload} disabled={uploading} className="flex items-center">
              {uploading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Upload {files.length} file(s)
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                previews.forEach(URL.revokeObjectURL)
                setFiles([])
                setPreviews([])
              }}
              disabled={uploading}
            >
              Clear
            </Button>
          </>
        )}

        {files.length === 0 && !uploading && (
          <Button variant="outline" onClick={() => document.getElementById("photos")?.click()}>
            Select Files
          </Button>
        )}
      </div>
    </div>
  )
}
