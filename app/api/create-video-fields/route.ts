import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // First, check if the settings table exists
    const { error: checkTableError } = await supabase.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'settings'
      );
    `)

    if (checkTableError) {
      console.error("Error checking if settings table exists:", checkTableError)

      // Create the settings table if it doesn't exist
      const { error: createTableError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          downloads_enabled BOOLEAN DEFAULT false,
          last_day_only BOOLEAN DEFAULT true,
          last_event_day TEXT DEFAULT '2025-04-25',
          video_url TEXT,
          video_path TEXT,
          video_title TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      if (createTableError) {
        console.error("Error creating settings table:", createTableError)
        return NextResponse.json({ success: false, error: "Failed to create settings table" }, { status: 500 })
      }
    }

    // Add video columns to settings table if they don't exist
    const { error: alterTableError } = await supabase.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE settings ADD COLUMN IF NOT EXISTS video_url TEXT;
        EXCEPTION WHEN OTHERS THEN
          -- Column might already exist
        END;
        
        BEGIN
          ALTER TABLE settings ADD COLUMN IF NOT EXISTS video_path TEXT;
        EXCEPTION WHEN OTHERS THEN
          -- Column might already exist
        END;
        
        BEGIN
          ALTER TABLE settings ADD COLUMN IF NOT EXISTS video_title TEXT;
        EXCEPTION WHEN OTHERS THEN
          -- Column might already exist
        END;
      END $$;
    `)

    if (alterTableError) {
      console.error("Error adding video columns to settings table:", alterTableError)
      return NextResponse.json({ success: false, error: "Failed to add video columns" }, { status: 500 })
    }

    // Insert default settings if they don't exist
    const { error: insertError } = await supabase.from("settings").upsert(
      {
        id: "global",
        downloads_enabled: false,
        last_day_only: true,
        last_event_day: "2025-04-25",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )

    if (insertError) {
      console.error("Error inserting default settings:", insertError)
      return NextResponse.json({ success: false, error: "Failed to insert default settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in create-video-fields:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
