import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Check if the settings table exists
    const { data: tableExists, error: tableCheckError } = await supabase.from("settings").select("id").limit(1).single()

    if (tableCheckError && !tableCheckError.message.includes("No rows found")) {
      console.error("Error checking settings table:", tableCheckError)
      return NextResponse.json({ error: "Failed to check settings table" }, { status: 500 })
    }

    // If the table doesn't exist, create it with all required columns
    if (!tableExists) {
      const { error: createTableError } = await supabase.rpc("create_settings_table")

      if (createTableError) {
        console.error("Error creating settings table:", createTableError)
        return NextResponse.json({ error: "Failed to create settings table" }, { status: 500 })
      }

      console.log("Settings table created successfully")
    }

    // Add video_url column if it doesn't exist
    const { error: addVideoUrlError } = await supabase.rpc("add_column_if_not_exists", {
      table_name: "settings",
      column_name: "video_url",
      column_type: "text",
    })

    if (addVideoUrlError) {
      console.error("Error adding video_url column:", addVideoUrlError)
      // Continue anyway, as the column might already exist
    }

    // Add video_path column if it doesn't exist
    const { error: addVideoPathError } = await supabase.rpc("add_column_if_not_exists", {
      table_name: "settings",
      column_name: "video_path",
      column_type: "text",
    })

    if (addVideoPathError) {
      console.error("Error adding video_path column:", addVideoPathError)
      // Continue anyway, as the column might already exist
    }

    // Add video_title column if it doesn't exist
    const { error: addVideoTitleError } = await supabase.rpc("add_column_if_not_exists", {
      table_name: "settings",
      column_name: "video_title",
      column_type: "text",
    })

    if (addVideoTitleError) {
      console.error("Error adding video_title column:", addVideoTitleError)
      // Continue anyway, as the column might already exist
    }

    // If we got here, either the columns were added or they already existed
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
