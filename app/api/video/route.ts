import { NextResponse } from "next/server"
import { getSettings } from "@/lib/server-settings"

export async function GET() {
  try {
    const settings = await getSettings()

    return NextResponse.json({
      videoUrl: settings.videoUrl || null,
      videoTitle: settings.videoTitle || null,
    })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}
