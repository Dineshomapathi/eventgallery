import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Create the add_column_if_not_exists function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION add_column_if_not_exists(
        _table_name text,
        _column_name text,
        _column_type text
      )
      RETURNS void AS $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = _table_name AND column_name = _column_name
        ) THEN
          EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', _table_name, _column_name, _column_type);
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Create the create_settings_table function
    const createSettingsTableFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_settings_table()
      RETURNS void AS $$
      BEGIN
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
        
        -- Insert default settings if not exists
        INSERT INTO settings (id, downloads_enabled, last_day_only, last_event_day)
        VALUES ('global', false, true, '2025-04-25')
        ON CONFLICT (id) DO NOTHING;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Execute the SQL to create the functions
    const { error: createFunctionError } = await supabase.rpc("exec_sql", { sql: createFunctionSQL })

    if (createFunctionError) {
      console.error("Error creating add_column_if_not_exists function:", createFunctionError)
      // Try direct approach to create the settings table
      const { error: directCreateError } = await supabase.rpc("exec_sql", {
        sql: `
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
          
          -- Insert default settings if not exists
          INSERT INTO settings (id, downloads_enabled, last_day_only, last_event_day)
          VALUES ('global', false, true, '2025-04-25')
          ON CONFLICT (id) DO NOTHING;
        `,
      })

      if (directCreateError) {
        console.error("Error with direct settings table creation:", directCreateError)
        return NextResponse.json({ error: "Failed to set up database functions" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Settings table created directly" })
    }

    // Create the settings table function
    const { error: createSettingsTableFunctionError } = await supabase.rpc("exec_sql", {
      sql: createSettingsTableFunctionSQL,
    })

    if (createSettingsTableFunctionError) {
      console.error("Error creating create_settings_table function:", createSettingsTableFunctionError)
      return NextResponse.json({ error: "Failed to create settings table function" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "SQL functions created successfully" })
  } catch (error) {
    console.error("Error in create-sql-functions endpoint:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
