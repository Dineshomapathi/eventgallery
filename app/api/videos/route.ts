import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get the most recent video from the database
    const { data, error } = await supabase.from("videos").select("*").order("created_at", { ascending: false }).limit(1)

    if (error) {
      console.error("Error fetching videos:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Check if any video was found
    if (data && data.length > 0) {
      return NextResponse.json({
        success: true,
        video: data[0],
      })
    }

    // No videos found
    return NextResponse.json({
      success: true,
      video: null,
    })
  } catch (error) {
    console.error("Error in videos endpoint:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
