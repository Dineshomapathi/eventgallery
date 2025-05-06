import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createBucketIfNotExists } from "@/lib/supabase-storage"
import { updateVideoSettings } from "@/lib/server-settings"

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 300, // 5 minutes for large uploads
}

export async function POST(request: NextRequest) {
  try {
    // Create videos bucket if it doesn't exist
    const bucketCreated = await createBucketIfNotExists("videos", true)
    if (!bucketCreated) {
      return NextResponse.json({ success: false, error: "Failed to create videos bucket" }, { status: 500 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = (formData.get("title") as string) || "Event Video"

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const fileExt = file.name.split(".").pop()
    const fileName = `event-video-${timestamp}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage.from("videos").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading video:", uploadError)
      return NextResponse.json({ success: false, error: "Failed to upload video" }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("videos").getPublicUrl(filePath)

    // Update settings with video URL
    const updated = await updateVideoSettings(publicUrl, filePath, title)
    if (!updated) {
      return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      videoUrl: publicUrl,
      videoPath: filePath,
      videoTitle: title,
    })
  } catch (error) {
    console.error("Error in video upload:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
