import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get the most recent background from the database
    const { data, error } = await supabase
      .from("backgrounds")
      .select("url")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching background:", error)
      return NextResponse.json({ backgroundUrl: null })
    }

    // Check if any background was found
    const backgroundUrl = data && data.length > 0 ? data[0].url : null

    return NextResponse.json({ backgroundUrl })
  } catch (error) {
    console.error("Error fetching background:", error)
    return NextResponse.json({ error: "Failed to fetch background" }, { status: 500 })
  }
}
