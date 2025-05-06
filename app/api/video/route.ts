import { NextResponse } from "next/server"
import { getSettings } from "@/lib/server-settings"

export async function GET() {
  try {
    // Get settings which include video information
    const settings = await getSettings()

    return NextResponse.json({
      videoUrl: settings.videoUrl || null,
      title: settings.videoTitle || "Event Video",
    })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}
