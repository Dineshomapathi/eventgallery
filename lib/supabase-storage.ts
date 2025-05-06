import { supabase } from "./supabase"

// Create a bucket if it doesn't exist
export async function createBucketIfNotExists(bucketName: string, isPublic = false) {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return false
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
      })

      if (createError) {
        console.error("Error creating bucket:", createError)
        return false
      }

      console.log(`Bucket ${bucketName} created successfully`)
    } else {
      console.log(`Bucket ${bucketName} already exists`)
    }

    return true
  } catch (error) {
    console.error("Error in createBucketIfNotExists:", error)
    return false
  }
}

// Upload a file to a bucket
export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void,
) {
  try {
    // Create bucket if it doesn't exist
    await createBucketIfNotExists(bucketName, true)

    // Upload file
    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      onUploadProgress: (progress) => {
        if (onProgress) {
          const percent = (progress.loaded / progress.total) * 100
          onProgress(percent)
        }
      },
    })

    if (error) {
      console.error("Error uploading file:", error)
      return { success: false, error }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    return { success: true, data: { ...data, publicUrl } }
  } catch (error) {
    console.error("Error in uploadFile:", error)
    return { success: false, error }
  }
}

// Delete a file from a bucket
export async function deleteFile(bucketName: string, filePath: string) {
  try {
    const { error } = await supabase.storage.from(bucketName).remove([filePath])

    if (error) {
      console.error("Error deleting file:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteFile:", error)
    return { success: false, error }
  }
}
