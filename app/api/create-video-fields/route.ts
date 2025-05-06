import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Check if settings table exists
    const { data: tableExists, error: tableCheckError } = await supabase.from("settings").select("id").limit(1)

    if (tableCheckError) {
      // If table doesn't exist, create it
      if (tableCheckError.message.includes("relation") && tableCheckError.message.includes("does not exist")) {
        const { error: createTableError } = await supabase.rpc("create_settings_table")

        if (createTableError) {
          // If RPC fails, try direct SQL
          const { error: directSqlError } = await supabase.query(`
            CREATE TABLE IF NOT EXISTS settings (
              id TEXT PRIMARY KEY,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              downloads_enabled BOOLEAN DEFAULT FALSE,
              last_day_only BOOLEAN DEFAULT FALSE,
              last_event_day DATE DEFAULT NULL
            )
          `)

          if (directSqlError) {
            throw new Error(`Failed to create settings table: ${directSqlError.message}`)
          }

          // Insert default record
          await supabase.from("settings").insert({ id: "global" }).select()
        }
      } else {
        throw new Error(`Error checking settings table: ${tableCheckError.message}`)
      }
    }

    // Check if video_url column exists
    const { data: columnData, error: columnError } = await supabase.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'settings' AND column_name = 'video_url'
    `)

    // If column doesn't exist or there was an error, add the column
    if (columnError || (columnData && columnData.length === 0)) {
      const { error: addColumnError } = await supabase.query(`
        ALTER TABLE settings 
        ADD COLUMN IF NOT EXISTS video_url TEXT,
        ADD COLUMN IF NOT EXISTS video_title TEXT
      `)

      if (addColumnError) {
        throw new Error(`Failed to add video columns: ${addColumnError.message}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating video fields:", error)
    return NextResponse.json(
      { error: "Failed to create video fields", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
