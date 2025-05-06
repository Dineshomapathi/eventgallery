import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // First, ensure the video fields exist in the settings table
    await fetch(new URL("/api/create-video-fields", request.url), {
      method: "POST",
    })

    // Get the form data from the request
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = (formData.get("title") as string) || "Event Video"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check if file is a video
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "File is not a video" }, { status: 400 })
    }

    // Create videos bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets()
    const videosBucketExists = buckets?.some((bucket) => bucket.name === "videos")

    if (!videosBucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket("videos", {
        public: true,
        fileSizeLimit: 600 * 1024 * 1024, // 600MB limit
      })

      if (createBucketError) {
        throw new Error(`Failed to create videos bucket: ${createBucketError.message}`)
      }
    }

    // Upload the video to Supabase storage
    const fileName = `event-video-${Date.now()}.mp4`
    const { data: uploadData, error: uploadError } = await supabase.storage.from("videos").upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`)
    }

    // Get the public URL for the uploaded video
    const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(fileName)

    const videoUrl = publicUrlData.publicUrl

    // Update the settings table with the new video URL
    const { error: updateError } = await supabase
      .from("settings")
      .update({
        video_url: videoUrl,
        video_title: title,
      })
      .eq("id", "global")

    if (updateError) {
      throw new Error(`Failed to update settings: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      title,
    })
  } catch (error) {
    console.error("Error uploading video:", error)
    return NextResponse.json(
      { error: "Failed to upload video", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
