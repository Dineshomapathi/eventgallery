import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { timeBlock: string } }) {
  try {
    const timeBlock = params.timeBlock
    console.log("API: Fetching photos for time block:", timeBlock)

    // Get URL parameters for pagination
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "12") // Default to 12 photos per page

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // First, get the total count of photos for this time block
    const { count, error: countError } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("time_block", timeBlock)

    if (countError) {
      console.error("Error counting photos:", countError)
      return NextResponse.json({ error: "Failed to count photos" }, { status: 500 })
    }

    console.log(`API: Found total of ${count} photos for time block:`, timeBlock)

    // Now get the actual photos for the current page only
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("time_block", timeBlock)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching photos:", error)
      return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
    }

    console.log(`API: Returning ${data.length} photos for page ${page} (limit: ${limit})`)

    // Format the photos to match the expected structure
    const photos = data.map((photo) => ({
      id: photo.id.toString(),
      publicId: photo.public_id,
      url: photo.url,
      thumbnailUrl: photo.thumbnail_url,
      timeBlock: photo.time_block,
      uploadedAt: photo.created_at,
    }))

    return NextResponse.json({
      photos,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}
