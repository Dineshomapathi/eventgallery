import { create } from "zustand"

interface SettingsState {
  // Download settings
  downloadsEnabled: boolean
  lastDayOnly: boolean
  lastEventDay: string
  isDownloadAllowed: boolean

  // Loading state
  isLoading: boolean
  lastFetchTime: string | null
  lastFetchError: string | null

  // Actions
  fetchSettings: () => Promise<void>
  refreshSettings: () => Promise<void>
  setDownloadsEnabled: (enabled: boolean) => Promise<void>
  setLastDayOnly: (enabled: boolean) => Promise<void>
  setLastEventDay: (date: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Default values
  downloadsEnabled: false,
  lastDayOnly: true,
  lastEventDay: "2025-04-25",
  isDownloadAllowed: false,
  isLoading: true,
  lastFetchTime: null,
  lastFetchError: null,

  // Fetch settings from the server
  fetchSettings: async () => {
    try {
      set({ isLoading: true, lastFetchError: null })
      const response = await fetch("/api/settings", {
        cache: "no-store", // Add this to prevent caching
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch settings: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("Fetched settings:", data)

      // Check if today is after or equal to the last event day
      const today = new Date().toISOString().split("T")[0]

      // IMPORTANT: Calculate isDownloadAllowed directly from the fetched data
      // If downloads are enabled and either lastDayOnly is false OR today is >= lastEventDay
      const isAllowed = data.downloadsEnabled && (!data.lastDayOnly || today >= data.lastEventDay)

      console.log("Download allowed calculation:", {
        downloadsEnabled: data.downloadsEnabled,
        lastDayOnly: data.lastDayOnly,
        today,
        lastEventDay: data.lastEventDay,
        isAllowed,
      })

      set({
        downloadsEnabled: data.downloadsEnabled,
        lastDayOnly: data.lastDayOnly,
        lastEventDay: data.lastEventDay,
        isDownloadAllowed: isAllowed,
        isLoading: false,
        lastFetchTime: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error fetching settings:", error)
      set({
        isLoading: false,
        lastFetchError: error instanceof Error ? error.message : String(error),
      })
    }
  },

  // Add a function to force refresh settings
  refreshSettings: async () => {
    await get().fetchSettings()
  },

  // Update downloads enabled setting
  setDownloadsEnabled: async (enabled) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ downloadsEnabled: enabled }),
      })

      if (!response.ok) {
        throw new Error("Failed to update settings")
      }

      // Update local state
      const { lastDayOnly, lastEventDay } = get()
      const today = new Date().toISOString().split("T")[0]
      const isAllowed = enabled && (!lastDayOnly || today >= lastEventDay)

      set({
        downloadsEnabled: enabled,
        isDownloadAllowed: isAllowed,
      })

      // Force refresh to ensure we have the latest settings
      await get().fetchSettings()
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  },

  // Update last day only setting
  setLastDayOnly: async (enabled) => {
    try {
      // First, update the local state immediately for better UI responsiveness
      set({ lastDayOnly: enabled })

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lastDayOnly: enabled }),
      })

      if (!response.ok) {
        throw new Error("Failed to update settings")
      }

      // Update local state
      const { downloadsEnabled, lastEventDay } = get()
      const today = new Date().toISOString().split("T")[0]
      const isAllowed = downloadsEnabled && (!enabled || today >= lastEventDay)

      set({
        lastDayOnly: enabled,
        isDownloadAllowed: isAllowed,
      })

      // Force refresh to ensure we have the latest settings
      await get().fetchSettings()
    } catch (error) {
      console.error("Error updating settings:", error)
      // If there was an error, revert the state change
      const { lastDayOnly } = get()
      set({ lastDayOnly: !enabled })
    }
  },

  // Update last event day setting
  setLastEventDay: async (date) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lastEventDay: date }),
      })

      if (!response.ok) {
        throw new Error("Failed to update settings")
      }

      // Update local state
      const { downloadsEnabled, lastDayOnly } = get()
      const today = new Date().toISOString().split("T")[0]
      const isAllowed = downloadsEnabled && (!lastDayOnly || today >= date)

      set({
        lastEventDay: date,
        isDownloadAllowed: isAllowed,
      })

      // Force refresh to ensure we have the latest settings
      await get().fetchSettings()
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  },
}))
