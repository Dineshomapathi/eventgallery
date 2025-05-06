import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Try to get the video URL from the settings table
    const { data, error } = await supabase.from("settings").select("video_url, video_title").eq("id", "global").single()

    if (error) {
      console.error("Error fetching video from settings:", error)

      // If the error is because the column doesn't exist, return empty response
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        return NextResponse.json({ videoUrl: null, title: null })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return the video URL if it exists
    return NextResponse.json({
      videoUrl: data?.video_url || null,
      title: data?.video_title || "Event Video",
    })
  } catch (error) {
    console.error("Error in video API:", error)
    return NextResponse.json({ error: "Failed to fetch video information" }, { status: 500 })
  }
}
