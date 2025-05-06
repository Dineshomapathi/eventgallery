import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // SQL to add video fields to the settings table if they don't exist
    const addVideoFieldsSQL = `
      DO $$
      BEGIN
        -- Check if video_url column exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'settings' AND column_name = 'video_url'
        ) THEN
          ALTER TABLE settings ADD COLUMN video_url TEXT;
        END IF;

        -- Check if video_path column exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'settings' AND column_name = 'video_path'
        ) THEN
          ALTER TABLE settings ADD COLUMN video_path TEXT;
        END IF;

        -- Check if video_title column exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'settings' AND column_name = 'video_title'
        ) THEN
          ALTER TABLE settings ADD COLUMN video_title TEXT;
        END IF;
      END $$;
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: addVideoFieldsSQL })

    if (error) {
      console.error("Error adding video fields to settings table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Video fields added to settings table successfully" })
  } catch (error) {
    console.error("Error in create-video-fields endpoint:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
