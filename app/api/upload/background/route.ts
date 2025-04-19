import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    console.log("Received background upload request")
    console.log("File details:", { name: file?.name, type: file?.type, size: file?.size })

    if (!file) {
      return NextResponse.json({ error: "No file provided", success: false }, { status: 400 })
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
      const filename = `backgrounds/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
      console.log("Generated filename:", filename)

      // Upload to Blob
      console.log("Uploading to Blob...")
      const blob = await put(filename, buffer, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: true,
      })
      console.log("Blob upload successful:", blob.url)

      // Store the background reference in the database
      console.log("Storing background reference in database...")
      const { error } = await supabase.from("backgrounds").insert({
        url: blob.url,
        public_id: blob.url,
      })

      if (error) {
        console.error("Error storing background reference:", error)
        return NextResponse.json(
          { error: `Failed to store background reference: ${error.message}`, success: false },
          { status: 500 },
        )
      }

      console.log("Database insert successful")

      // Revalidate the homepage to show the new background
      revalidatePath("/")

      return NextResponse.json({
        success: true,
        url: blob.url,
        publicId: blob.url,
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
    console.error("Error in background upload handler:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
        success: false,
      },
      { status: 500 },
    )
  }
}
