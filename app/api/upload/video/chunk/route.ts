import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Set a smaller body size limit for chunks
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // 10MB per chunk
    },
  },
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const chunk = formData.get("chunk") as File
    const uploadId = formData.get("uploadId") as string
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)

    if (!chunk || uploadId === undefined || chunkIndex === undefined || totalChunks === undefined) {
      return NextResponse.json({ success: false, error: "Missing required chunk information" }, { status: 400 })
    }

    // Get the metadata for this upload
    const metadataPath = `temp/${uploadId}/metadata.json`
    const { data: metadataObj, error: metadataError } = await supabase.storage.from("videos").download(metadataPath)

    if (metadataError) {
      console.error("Error fetching upload metadata:", metadataError)
      return NextResponse.json({ success: false, error: "Upload session not found or expired" }, { status: 404 })
    }

    // Parse the metadata
    const metadataText = await metadataObj.text()
    const metadata = JSON.parse(metadataText)

    // Convert chunk to buffer
    const arrayBuffer = await chunk.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload the chunk to Supabase storage
    const chunkPath = `temp/${uploadId}/chunk_${chunkIndex}`
    const { error: uploadError } = await supabase.storage.from("videos").upload(chunkPath, buffer, {
      contentType: "application/octet-stream",
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading chunk:", uploadError)
      return NextResponse.json({ success: false, error: "Failed to upload chunk" }, { status: 500 })
    }

    // Update metadata with the new chunk
    metadata.chunksReceived = metadata.chunksReceived + 1

    // Update the metadata in storage
    const { error: updateError } = await supabase.storage
      .from("videos")
      .upload(metadataPath, JSON.stringify(metadata), {
        contentType: "application/json",
        upsert: true,
      })

    if (updateError) {
      console.error("Error updating metadata:", updateError)
      // Not critical, we can continue
    }

    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`,
      progress: Math.round(((chunkIndex + 1) / totalChunks) * 100),
    })
  } catch (error) {
    console.error("Error uploading chunk:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload chunk",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
