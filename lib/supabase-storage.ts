import { supabase } from "./supabase"
import { v4 as uuidv4 } from "uuid"

/**
 * Uploads a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param folder The folder path within the bucket
 * @returns Object with the file URL and path
 */
export async function uploadToSupabaseStorage(
  file: File | Buffer,
  bucket = "videos",
  folder = "event-videos",
): Promise<{ url: string; path: string }> {
  try {
    // Create a unique filename
    const fileExt = file instanceof File ? file.name.split(".").pop() : "mp4"
    const fileName = `${folder}/${Date.now()}-${uuidv4()}.${fileExt}`

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading to Supabase Storage:", error)
      throw error
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error("Error in uploadToSupabaseStorage:", error)
    throw error
  }
}

/**
 * Deletes a file from Supabase Storage
 * @param path The file path to delete
 * @param bucket The storage bucket name
 * @returns Boolean indicating success
 */
export async function deleteFromSupabaseStorage(path: string, bucket = "videos"): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Error deleting from Supabase Storage:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteFromSupabaseStorage:", error)
    return false
  }
}
