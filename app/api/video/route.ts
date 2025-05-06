import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Check if the settings table exists and has the video_url column
    const { data: tableInfo, error: tableError } = await supabase
      .from("settings")
      .select("video_url")
      .eq("id", 1)
      .single()

    if (tableError && tableError.code !== "PGRST116") {
      // If error is not "no rows found", it's a real error
      console.error("Error checking settings table:", tableError)
      return NextResponse.json({ success: false, error: "Failed to check settings table" }, { status: 500 })
    }

    // If we got data, return the video URL
    if (tableInfo && tableInfo.video_url) {
      return NextResponse.json({
        success: true,
        videoUrl: tableInfo.video_url,
      })
    }

    // If no video URL found, return success but no URL
    return NextResponse.json({
      success: true,
      videoUrl: null,
    })
  } catch (error) {
    console.error("Error fetching video URL:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
