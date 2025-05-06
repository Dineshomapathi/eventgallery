import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    // Create the videos table if it doesn't exist
    const { error } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Videos table created successfully",
    })
  } catch (error) {
    console.error("Error creating videos table:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
