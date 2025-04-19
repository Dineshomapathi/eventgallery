import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test Supabase connection
    console.log("Testing Supabase connection...")
    const { data: supabaseTest, error: supabaseError } = await supabase.from("photos").select("count").limit(1)

    if (supabaseError) {
      console.error("Supabase connection test failed:", supabaseError)
      return NextResponse.json({
        success: false,
        supabaseError: supabaseError.message,
      })
    }

    console.log("Supabase connection successful:", supabaseTest)

    // Test Vercel Blob connection
    console.log("Testing Vercel Blob connection...")
    try {
      const testBlob = await put(
        `test/test-${Date.now()}.txt`,
        Buffer.from("This is a test file to verify Blob is working."),
        {
          access: "public",
          contentType: "text/plain",
          addRandomSuffix: true,
        },
      )

      console.log("Blob connection successful:", testBlob.url)

      return NextResponse.json({
        success: true,
        message: "Both Supabase and Vercel Blob connections are working correctly.",
        supabaseResult: supabaseTest,
        blobUrl: testBlob.url,
      })
    } catch (blobError) {
      console.error("Blob connection test failed:", blobError)
      return NextResponse.json({
        success: false,
        supabaseResult: supabaseTest,
        blobError: blobError instanceof Error ? blobError.message : "Unknown Blob error",
      })
    }
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    })
  }
}
