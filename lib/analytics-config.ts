import type { VercelAnalyticsConfig } from "@vercel/analytics/react"

// Custom configuration for Vercel Analytics
export const analyticsConfig: VercelAnalyticsConfig = {
  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Mode can be 'auto', 'development', or 'production'
  mode: "auto",
}
