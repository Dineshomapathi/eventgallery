import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { timeBlock: string } }) {
  try {
    const timeBlock = params.timeBlock

    // Get photos for the specified time block from the database
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("time_block", timeBlock)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching photos:", error)
      return NextResponse.json({ photos: [] })
    }

    // Format the photos to match the expected structure
    const photos = data.map((photo) => ({
      id: photo.id.toString(),
      publicId: photo.public_id,
      url: photo.url,
      thumbnailUrl: photo.thumbnail_url,
      timeBlock: photo.time_block,
      uploadedAt: photo.created_at,
    }))

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}
