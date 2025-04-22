import type { VercelAnalyticsConfig } from "@vercel/analytics/react"

// Custom configuration for Vercel Analytics
export const analyticsConfig: VercelAnalyticsConfig = {
  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Custom data attributes to track
  beforeSend: (event) => {
    // You can modify events before they're sent
    // For example, add custom properties
    return {
      ...event,
      // Add any custom properties you want to track
      properties: {
        ...event.properties,
        app: "ROPTC Conference Gallery",
      },
    }
  },

  // Mode can be 'auto', 'development', or 'production'
  mode: "auto",
}
