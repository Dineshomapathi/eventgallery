import type { MutableRefObject } from "react"

/**
 * Compresses an image file to a target size while maintaining quality
 * @param file The original image file
 * @param maxSizeMB Maximum size in MB
 * @param quality Initial quality (0-1)
 * @returns Promise with compressed file
 */
export async function compressImage(file: File, maxSizeMB = 2, quality = 0.8): Promise<File> {
  // If file is already smaller than max size, return it
  if (file.size / 1024 / 1024 < maxSizeMB) {
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        const MAX_WIDTH = 2000
        const MAX_HEIGHT = 2000
        if (width > height && width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        } else if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height)
          height = MAX_HEIGHT
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        // Try to compress with initial quality
        let compressedFile = canvasToFile(canvas, file.name, file.type, quality)

        // If still too large, reduce quality incrementally
        if (compressedFile.size / 1024 / 1024 > maxSizeMB && quality > 0.3) {
          quality -= 0.1
          compressedFile = canvasToFile(canvas, file.name, file.type, quality)
        }

        resolve(compressedFile)
      }
      img.onerror = (error) => {
        reject(error)
      }
    }
    reader.onerror = (error) => {
      reject(error)
    }
  })
}

/**
 * Converts a canvas to a File object
 */
function canvasToFile(canvas: HTMLCanvasElement, fileName: string, fileType: string, quality: number): File {
  const dataUrl = canvas.toDataURL(fileType, quality)
  const blobBin = atob(dataUrl.split(",")[1])
  const array = []
  for (let i = 0; i < blobBin.length; i++) {
    array.push(blobBin.charCodeAt(i))
  }
  const blob = new Blob([new Uint8Array(array)], { type: fileType })
  return new File([blob], fileName, { type: fileType })
}

/**
 * Creates a preview URL for an image file
 * @param file Image file
 * @returns Object with preview URL and cleanup function
 */
export function createPreviewUrl(file: File): { url: string; revoke: () => void } {
  const url = URL.createObjectURL(file)
  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  }
}

/**
 * Hook to track upload progress
 * @param progressRef Ref to store progress (0-100)
 * @param file File being uploaded
 * @param url Upload endpoint
 * @param formData Additional form data
 * @returns Promise with response
 */
export async function uploadWithProgress(
  progressRef: MutableRefObject<number>,
  file: File,
  url: string,
  formData: Record<string, string>,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const fd = new FormData()

    // Add the file and other form data
    fd.append("file", file)
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value)
    })

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        progressRef.current = Math.round((event.loaded / event.total) * 100)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(
          new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
          }),
        )
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error("Network Error"))

    xhr.open("POST", url)
    xhr.responseType = "json"
    xhr.send(fd)
  })
}
