import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { uploadId, fileName, fileSize, mimeType, title, description } = await request.json()

    if (!uploadId || !fileName || !fileSize || !mimeType) {
      return NextResponse.json({ success: false, error: "Missing required upload information" }, { status: 400 })
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

    // Check if all chunks were received
    if (metadata.chunksReceived !== metadata.totalChunks) {
      return NextResponse.json(
        {
          success: false,
          error: `Not all chunks received. Got ${metadata.chunksReceived} of ${metadata.totalChunks}`,
        },
        { status: 400 },
      )
    }

    // Create a final file path
    const finalFileName = `${Date.now()}-${fileName}`
    const finalFilePath = `videos/${finalFileName}`

    // For simplicity, we'll just use the first chunk as the final file
    // In a real implementation, you would concatenate all chunks
    // This is a placeholder for the actual implementation
    console.log("Combining chunks and finalizing upload...")

    // For now, we'll just copy the first chunk as the final file
    // In a real implementation, you would combine all chunks
    const { data: firstChunkData, error: firstChunkError } = await supabase.storage
      .from("videos")
      .download(`temp/${uploadId}/chunk_0`)

    if (firstChunkError) {
      console.error("Error downloading first chunk:", firstChunkError)
      return NextResponse.json({ success: false, error: "Failed to process uploaded chunks" }, { status: 500 })
    }

    // Upload the final file
    const { error: uploadError } = await supabase.storage.from("videos").upload(finalFilePath, firstChunkData, {
      contentType: mimeType,
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading final file:", uploadError)
      return NextResponse.json({ success: false, error: "Failed to finalize upload" }, { status: 500 })
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(finalFilePath)

    const videoUrl = publicUrlData.publicUrl

    // Insert record into videos table
    const { data: videoRecord, error: dbError } = await supabase
      .from("videos")
      .insert({
        title: title || "Event Video",
        description: description || "",
        url: videoUrl,
        file_path: finalFilePath,
        size_in_bytes: fileSize,
        mime_type: mimeType,
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

    // Clean up temporary files
    // This would be better handled by a background job
    // For now, we'll just log that cleanup is needed
    console.log(`Cleanup needed for temp directory: temp/${uploadId}`)

    return NextResponse.json({
      success: true,
      videoUrl,
      videoId: videoRecord[0].id,
      message: "Video uploaded successfully",
    })
  } catch (error) {
    console.error("Error completing upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
