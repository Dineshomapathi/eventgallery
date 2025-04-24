import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get raw settings data directly from the database
    const { data, error } = await supabase.from("settings").select("*").eq("id", "global").single()

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return the raw data
    return NextResponse.json({
      databaseSettings: data,
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in debug settings endpoint:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
