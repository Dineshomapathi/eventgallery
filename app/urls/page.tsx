"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UrlsPage() {
  const [baseUrl, setBaseUrl] = useState<string>("")

  // Determine the base URL at runtime on the client side
  useEffect(() => {
    // Use the current window location to determine the base URL
    const url = new URL(window.location.href)
    setBaseUrl(`${url.protocol}//${url.host}`)
  }, [])

  const urls = [
    {
      name: "Main Gallery",
      url: "/",
      description: "The main event gallery page accessible to attendees",
    },
    {
      name: "Admin Dashboard",
      url: "/admin",
      description: "Admin dashboard for managing the gallery",
    },
    {
      name: "Background Upload API",
      url: "/api/upload/background",
      description: "API endpoint for uploading background images",
    },
    {
      name: "Photo Upload API",
      url: "/api/upload/photos",
      description: "API endpoint for uploading photos to time blocks",
    },
    {
      name: "Background Fetch API",
      url: "/api/background",
      description: "API endpoint for fetching the current background",
    },
    {
      name: "Photos Fetch API",
      url: "/api/photos/[timeBlock]",
      description: "API endpoint for fetching photos for a specific time block",
    },
    {
      name: "Purge Data API",
      url: "/api/purge",
      description: "API endpoint for purging all data",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Application URLs</h1>

      <div className="grid gap-6">
        {urls.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <code className="bg-slate-100 p-2 rounded text-sm break-all">
                  {baseUrl}
                  {item.url}
                </code>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-3 py-1 bg-slate-200 rounded hover:bg-slate-300 text-sm"
                >
                  Open
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
