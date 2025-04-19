import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const timeBlock = formData.get("timeBlock") as string

    console.log("Received upload request for time block:", timeBlock)
    console.log("File details:", { name: file?.name, type: file?.type, size: file?.size })

    if (!file) {
      return NextResponse.json({ error: "No file provided", success: false }, { status: 400 })
    }

    if (!timeBlock) {
      return NextResponse.json({ error: "Time block not specified", success: false }, { status: 400 })
    }

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image", success: false }, { status: 400 })
    }

    try {
      // Convert file to buffer
      console.log("Converting file to buffer...")
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Generate a unique filename
      const filename = `photos/${timeBlock}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
      console.log("Generated filename:", filename)

      // Upload to Blob
      console.log("Uploading to Blob...")
      const blob = await put(filename, buffer, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: true,
      })
      console.log("Blob upload successful:", blob.url)

      // Create photo object
      const photo = {
        public_id: blob.url,
        url: blob.url,
        thumbnail_url: blob.url,
        time_block: timeBlock,
      }

      // Store the photo reference in the database
      console.log("Storing photo reference in database...")
      const { data, error } = await supabase.from("photos").insert(photo).select()

      if (error) {
        console.error("Error storing photo reference:", error)
        return NextResponse.json(
          { error: `Failed to store photo reference: ${error.message}`, success: false },
          { status: 500 },
        )
      }

      console.log("Database insert successful:", data)

      // Revalidate the gallery page
      revalidatePath("/")

      return NextResponse.json({
        success: true,
        id: data[0].id,
        publicId: photo.public_id,
        url: photo.url,
        thumbnailUrl: photo.thumbnail_url,
        timeBlock: photo.time_block,
        uploadedAt: data[0].created_at,
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
    console.error("Error in photo upload handler:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
        success: false,
      },
      { status: 500 },
    )
  }
}
