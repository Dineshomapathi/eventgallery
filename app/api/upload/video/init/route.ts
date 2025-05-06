import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Initialize a new chunked upload
export async function POST(request: Request) {
  try {
    const { fileName, fileSize, mimeType, totalChunks, title, description } = await request.json()

    if (!fileName || !fileSize || !mimeType || !totalChunks) {
      return NextResponse.json({ success: false, error: "Missing required upload information" }, { status: 400 })
    }

    // Create a temporary record in a uploads_in_progress table or use localStorage
    // For simplicity, we'll just return an upload ID
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    // Create a temporary directory in Supabase storage for chunks
    const tempDir = `temp/${uploadId}`

    // Store upload metadata in Supabase storage
    const metadataPath = `${tempDir}/metadata.json`
    const metadata = {
      fileName,
      fileSize,
      mimeType,
      totalChunks,
      title,
      description,
      uploadId,
      chunksReceived: 0,
      createdAt: new Date().toISOString(),
    }

    const { error } = await supabase.storage.from("videos").upload(metadataPath, JSON.stringify(metadata), {
      contentType: "application/json",
      upsert: true,
    })

    if (error) {
      console.error("Error storing upload metadata:", error)
      return NextResponse.json({ success: false, error: "Failed to initialize upload" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      uploadId,
      message: "Upload initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
