import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get settings directly from Supabase
    const { data, error } = await supabase.from("settings").select("video_url, video_title").eq("id", "global").single()

    if (error) {
      console.error("Error fetching video settings:", error)

      // If the error is that no rows were found, return empty data
      if (error.message.includes("No rows found")) {
        return NextResponse.json({ videoUrl: null, title: null })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      videoUrl: data?.video_url || null,
      title: data?.video_title || "Event Video",
    })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}
