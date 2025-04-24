import { NextResponse } from "next/server"
import { getSettings, updateSettings, type AppSettings } from "@/lib/server-settings"

// GET endpoint to retrieve settings
export async function GET() {
  try {
    const settings = await getSettings()

    // Add cache control headers
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// POST endpoint to update settings
export async function POST(request: Request) {
  try {
    const settings = (await request.json()) as Partial<AppSettings>
    const success = await updateSettings(settings)

    if (!success) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
