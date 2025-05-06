import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from "@/lib/supabase-storage"
import { getSettings, updateVideoSettings } from "@/lib/server-settings"

// Increase the body parser size limit for video uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "600mb", // Increased for video files
    },
  },
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = (formData.get("title") as string) || "Event Video"

    console.log("Received video upload request")
    console.log("File details:", {
      name: file?.name,
      type: file?.type,
      size: `${(file?.size / 1024 / 1024).toFixed(2)}MB`,
    })

    if (!file) {
      return NextResponse.json({ error: "No file provided", success: false }, { status: 400 })
    }

    // Check if file is a video
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "File must be a video", success: false }, { status: 400 })
    }

    // Check file size (client-side validation backup)
    const fileSizeMB = file.size / 1024 / 1024
    if (fileSizeMB > 600) {
      return NextResponse.json({ error: "File size exceeds the 600MB limit", success: false }, { status: 400 })
    }

    try {
      // Get current settings to check if we need to delete an existing video
      const currentSettings = await getSettings()

      // If there's an existing video, delete it from storage
      if (currentSettings.videoPath) {
        console.log("Deleting existing video:", currentSettings.videoPath)
        await deleteFromSupabaseStorage(currentSettings.videoPath)
      }

      // Upload the new video to Supabase Storage
      console.log("Uploading video to Supabase Storage...")
      const { url, path } = await uploadToSupabaseStorage(file)
      console.log("Upload successful:", { url, path })

      // Update settings with the new video information
      console.log("Updating settings with new video information...")
      const success = await updateVideoSettings(url, path, title)

      if (!success) {
        throw new Error("Failed to update settings with video information")
      }

      console.log("Video settings updated successfully")

      // Revalidate the homepage to show the new video
      revalidatePath("/")

      return NextResponse.json({
        success: true,
        url: url,
        path: path,
        title: title,
      })
    } catch (uploadError) {
      console.error("Error during upload process:", uploadError)
      return NextResponse.json(
        {
          error: uploadError instanceof Error ? uploadError.message : "An unknown error occurred during upload",
          success: false,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in video upload handler:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
        success: false,
      },
      { status: 500 },
    )
  }
}
