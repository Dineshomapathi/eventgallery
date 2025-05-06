import type { SupabaseClient } from "@supabase/supabase-js"

// Create a bucket if it doesn't exist
export async function createBucket(supabase: SupabaseClient, bucketName: string) {
  const { data: buckets } = await supabase.storage.listBuckets()

  // Check if the bucket already exists
  const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

  if (!bucketExists) {
    // Create the bucket with public access
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 1024 * 1024 * 1024, // 1GB limit
    })

    if (error) {
      console.error(`Error creating ${bucketName} bucket:`, error)
      throw error
    }

    console.log(`Created ${bucketName} bucket`)
  }
}

// Upload a file to Supabase storage
export async function uploadToSupabase(supabase: SupabaseClient, bucket: string, file: File) {
  // Generate a unique file path
  const timestamp = new Date().getTime()
  const fileExt = file.name.split(".").pop()
  const filePath = `${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`

  // Upload the file
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  return { path: data?.path || filePath, error }
}
