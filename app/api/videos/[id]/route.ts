import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ success: false, error: "Video ID is required" }, { status: 400 })
    }

    // First, get the video record to get the file path
    const { data: video, error: fetchError } = await supabase.from("videos").select("file_path").eq("id", id).single()

    if (fetchError) {
      console.error("Error fetching video:", fetchError)
      return NextResponse.json({ success: false, error: "Failed to fetch video" }, { status: 500 })
    }

    if (!video) {
      return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 })
    }

    // Delete the file from storage
    const { error: storageError } = await supabase.storage.from("videos").remove([video.file_path])

    if (storageError) {
      console.error("Error deleting video from storage:", storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete the record from the database
    const { error: dbError } = await supabase.from("videos").delete().eq("id", id)

    if (dbError) {
      console.error("Error deleting video from database:", dbError)
      return NextResponse.json({ success: false, error: "Failed to delete video from database" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
    })
  } catch (error) {
    console.error("Error in video deletion handler:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
