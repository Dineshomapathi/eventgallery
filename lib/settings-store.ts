import { create } from "zustand"

interface SettingsState {
  // Download settings
  downloadsEnabled: boolean
  lastDayOnly: boolean
  lastEventDay: string
  isDownloadAllowed: boolean

  // Loading state
  isLoading: boolean

  // Actions
  fetchSettings: () => Promise<void>
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

  // Fetch settings from the server
  fetchSettings: async () => {
    try {
      set({ isLoading: true })
      const response = await fetch("/api/settings")

      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }

      const data = await response.json()

      // Check if today is after or equal to the last event day
      const today = new Date().toISOString().split("T")[0]
      const isAllowed = data.downloadsEnabled && (!data.lastDayOnly || today >= data.lastEventDay)

      set({
        downloadsEnabled: data.downloadsEnabled,
        lastDayOnly: data.lastDayOnly,
        lastEventDay: data.lastEventDay,
        isDownloadAllowed: isAllowed,
        isLoading: false,
      })
    } catch (error) {
      console.error("Error fetching settings:", error)
      set({ isLoading: false })
    }
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
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  },

  // Update last day only setting
  setLastDayOnly: async (enabled) => {
    try {
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
    } catch (error) {
      console.error("Error updating settings:", error)
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
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  },
}))
