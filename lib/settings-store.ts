import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SettingsState {
  // Download settings
  downloadsEnabled: boolean
  setDownloadsEnabled: (enabled: boolean) => void

  // Last day settings
  lastDayOnly: boolean
  setLastDayOnly: (enabled: boolean) => void

  // Last day of the event
  lastEventDay: string
  setLastEventDay: (date: string) => void

  // Check if downloads should be allowed based on current settings
  isDownloadAllowed: () => boolean
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default: downloads disabled
      downloadsEnabled: false,
      setDownloadsEnabled: (enabled) => set({ downloadsEnabled: enabled }),

      // Default: last day only enabled
      lastDayOnly: true,
      setLastDayOnly: (enabled) => set({ lastDayOnly: enabled }),

      // Default last day of the event
      lastEventDay: "2025-04-25",
      setLastEventDay: (date) => set({ lastEventDay: date }),

      // Check if downloads should be allowed
      isDownloadAllowed: () => {
        const { downloadsEnabled, lastDayOnly, lastEventDay } = get()

        // If downloads are disabled entirely, return false
        if (!downloadsEnabled) return false

        // If last day only is disabled, return true (downloads allowed any day)
        if (!lastDayOnly) return true

        // If last day only is enabled, check if today is the last day
        const today = new Date().toISOString().split("T")[0]
        return today >= lastEventDay
      },
    }),
    {
      name: "event-gallery-settings",
    },
  ),
)
