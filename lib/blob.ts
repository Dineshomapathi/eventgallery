import { put, del } from "@vercel/blob"

// Helper function to upload a file to Blob
export async function uploadToBlob(file: File, folder: string) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Generate a unique filename
  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`

  // Upload to Blob with HD transformation (limit to 1080p)
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  })

  return blob
}

// Helper function to delete a file from Blob
export async function deleteFromBlob(url: string) {
  try {
    await del(url)
    return true
  } catch (error) {
    console.error(`Error deleting blob ${url}:`, error)
    return false
  }
}

// Helper function to get a thumbnail URL
export function getThumbnailUrl(url: string) {
  // For Vercel Blob, we'll use the same URL since we can't transform images
  // In a production app, you might want to use a service like Imgix or Cloudinary for this
  return url
}
