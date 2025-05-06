import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Create videos table if it doesn't exist
    const { error: createTableError } = await supabase.rpc("create_videos_table_if_not_exists")

    if (createTableError) {
      console.error("Error creating videos table:", createTableError)

      // Try direct SQL approach if RPC fails
      const { error: directSqlError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          description TEXT,
          url TEXT NOT NULL,
          path TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      if (directSqlError) {
        console.error("Error with direct SQL for videos table:", directSqlError)
        return NextResponse.json({ success: false, error: "Failed to create videos table" }, { status: 500 })
      }
    }

    // Add video columns to settings table if they don't exist
    const { error: alterTableError } = await supabase.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE settings ADD COLUMN IF NOT EXISTS video_url TEXT;
        EXCEPTION WHEN OTHERS THEN
          -- Column might already exist or table doesn't exist
        END;
        
        BEGIN
          ALTER TABLE settings ADD COLUMN IF NOT EXISTS video_path TEXT;
        EXCEPTION WHEN OTHERS THEN
          -- Column might already exist or table doesn't exist
        END;
        
        BEGIN
          ALTER TABLE settings ADD COLUMN IF NOT EXISTS video_title TEXT;
        EXCEPTION WHEN OTHERS THEN
          -- Column might already exist or table doesn't exist
        END;
      END $$;
    `)

    if (alterTableError) {
      console.error("Error adding video columns to settings table:", alterTableError)
      return NextResponse.json({ success: false, error: "Failed to add video columns" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in create-videos-table:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
