import { supabase } from "./supabase"

// Settings interface
export interface AppSettings {
  downloadsEnabled: boolean
  lastDayOnly: boolean
  lastEventDay: string
}

// Default settings
export const defaultSettings: AppSettings = {
  downloadsEnabled: false,
  lastDayOnly: true,
  lastEventDay: "2025-04-25",
}

// Get settings from the database
export async function getSettings(): Promise<AppSettings> {
  try {
    const { data, error } = await supabase.from("settings").select("*").eq("id", "global").single()

    if (error || !data) {
      console.log("No settings found, using defaults")
      return defaultSettings
    }

    // Ensure boolean values are properly handled
    return {
      downloadsEnabled: Boolean(data.downloads_enabled) || false,
      lastDayOnly: data.last_day_only === false ? false : true, // Explicitly handle false case
      lastEventDay: data.last_event_day || "2025-04-25",
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
    return defaultSettings
  }
}

// Update settings in the database
export async function updateSettings(settings: Partial<AppSettings>): Promise<boolean> {
  try {
    console.log("Server updating settings:", settings)

    // Prepare the data for upsert, ensuring boolean values are properly handled
    const data: any = {
      id: "global",
      updated_at: new Date().toISOString(),
    }

    if (settings.downloadsEnabled !== undefined) {
      data.downloads_enabled = Boolean(settings.downloadsEnabled)
    }

    if (settings.lastDayOnly !== undefined) {
      data.last_day_only = Boolean(settings.lastDayOnly)
    }

    if (settings.lastEventDay !== undefined) {
      data.last_event_day = settings.lastEventDay
    }

    const { error } = await supabase.from("settings").upsert(data)

    if (error) {
      console.error("Error updating settings:", error)
      return false
    }

    console.log("Settings updated successfully")
    return true
  } catch (error) {
    console.error("Error updating settings:", error)
    return false
  }
}

// Check if downloads are allowed based on current settings
export async function isDownloadAllowed(): Promise<boolean> {
  const settings = await getSettings()

  // If downloads are disabled entirely, return false
  if (!settings.downloadsEnabled) return false

  // If last day only is disabled, return true (downloads allowed any day)
  if (!settings.lastDayOnly) return true

  // If last day only is enabled, check if today is the last day
  const today = new Date().toISOString().split("T")[0]
  return today >= settings.lastEventDay
}
