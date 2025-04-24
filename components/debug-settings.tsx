"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/lib/settings-store"

export function DebugSettings() {
  const [dbSettings, setDbSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const store = useSettingsStore()

  const fetchDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/settings")
      const data = await response.json()
      setDbSettings(data)
    } catch (error) {
      console.error("Error fetching debug info:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-md text-xs">
      <h3 className="font-bold mb-2">Settings Debug</h3>
      <div className="space-y-2">
        <div>
          <strong>Store State:</strong>
          <pre className="bg-gray-100 p-1 rounded mt-1 overflow-auto max-h-20">
            {JSON.stringify(
              {
                downloadsEnabled: store.downloadsEnabled,
                lastDayOnly: store.lastDayOnly,
                lastEventDay: store.lastEventDay,
                isDownloadAllowed: store.isDownloadAllowed,
                isLoading: store.isLoading,
                lastFetchTime: store.lastFetchTime,
                lastFetchError: store.lastFetchError,
              },
              null,
              2,
            )}
          </pre>
        </div>
        <div>
          <strong>Database Settings:</strong>
          <pre className="bg-gray-100 p-1 rounded mt-1 overflow-auto max-h-20">
            {dbSettings ? JSON.stringify(dbSettings, null, 2) : "Loading..."}
          </pre>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={fetchDebugInfo} disabled={loading}>
            Refresh DB
          </Button>
          <Button size="sm" variant="outline" onClick={() => store.fetchSettings()}>
            Refresh Store
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Force the download allowed state
              useSettingsStore.setState({
                isDownloadAllowed: true,
                downloadsEnabled: true,
                lastDayOnly: false,
              })
            }}
          >
            Force Enable
          </Button>
        </div>
      </div>
    </div>
  )
}
