import type React from "react"
import { NavBar } from "@/components/nav-bar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"
import { analyticsConfig } from "@/lib/analytics-config"
import { cn } from "@/lib/utils"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ROPTC Conference Gallery",
  description: "23rd Regional Olefins Producer Technical Committee Conference Gallery",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: any
}>) {
  // Determine if we're on the home page
  const isHomePage = params?.segment === undefined

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background overflow-x-hidden")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {/* Only show NavBar on non-home pages */}
          {!isHomePage && <NavBar />}
          <Suspense>{children}</Suspense>
          <Toaster />
        </ThemeProvider>
        {/* Vercel Analytics with custom configuration */}
        <Analytics {...analyticsConfig} />
      </body>
    </html>
  )
}
