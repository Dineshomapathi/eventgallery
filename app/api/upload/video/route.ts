import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Set a higher body size limit for video uploads (600MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "600mb",
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = (formData.get("title") as string) || "Event Video"
    const description = (formData.get("description") as string) || ""

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only video files are allowed." },
        { status: 400 },
      )
    }

    // Check file size (max 600MB)
    if (file.size > 600 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 600MB." }, { status: 400 })
    }

    console.log("Processing video upload:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      title,
      description,
    })

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate a unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
    const filePath = `videos/${fileName}`

    console.log("Uploading to Supabase Storage:", filePath)

    // Upload to Supabase Storage using service role key to bypass auth
    const { data: uploadData, error: uploadError } = await supabase.storage.from("videos").upload(filePath, buffer, {
      contentType: file.type,
      upsert: true, // Replace if exists
    })

    if (uploadError) {
      console.error("Supabase storage error:", uploadError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload video to storage",
          details: uploadError.message,
        },
        { status: 500 },
      )
    }

    console.log("Upload successful:", uploadData)

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(filePath)
    const videoUrl = publicUrlData.publicUrl

    console.log("Public URL:", videoUrl)

    // Insert record into videos table
    const { data: videoRecord, error: dbError } = await supabase
      .from("videos")
      .insert({
        title,
        description,
        url: videoUrl,
        file_path: filePath,
        size_in_bytes: file.size,
        mime_type: file.type,
        // We don't have duration info at this point
        duration_in_seconds: null,
        thumbnail_url: null,
      })
      .select()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save video record in database",
          details: dbError.message,
        },
        { status: 500 },
      )
    }

    console.log("Video record created:", videoRecord)

    return NextResponse.json({
      success: true,
      videoUrl,
      videoId: videoRecord[0].id,
      message: "Video uploaded successfully",
    })
  } catch (error) {
    console.error("Error handling video upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
