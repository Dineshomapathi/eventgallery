import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { deleteFromBlob } from "@/lib/blob"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { id, url } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Photo ID is required", success: false }, { status: 400 })
    }

    console.log(`Deleting photo with ID: ${id}`)

    // Delete the image from Vercel Blob if URL is provided
    if (url) {
      const blobDeleted = await deleteFromBlob(url)
      console.log(`Blob deletion ${blobDeleted ? "successful" : "failed"} for URL: ${url}`)
    }

    // Delete the photo record from the database
    const { error } = await supabase.from("photos").delete().eq("id", id)

    if (error) {
      console.error("Error deleting photo from database:", error)
      return NextResponse.json({ error: `Failed to delete photo: ${error.message}`, success: false }, { status: 500 })
    }

    // Revalidate the gallery page
    revalidatePath("/")

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    })
  } catch (error) {
    console.error("Error in photo deletion handler:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
        success: false,
      },
      { status: 500 },
    )
  }
}
