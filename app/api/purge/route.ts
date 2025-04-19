import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { deleteFromBlob } from "@/lib/blob"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // Get all backgrounds from the database
    const { data: backgrounds, error: bgError } = await supabase.from("backgrounds").select("url, public_id")

    if (bgError) {
      console.error("Error fetching backgrounds:", bgError)
      return NextResponse.json({ error: "Failed to fetch backgrounds" }, { status: 500 })
    }

    // Get all photos from the database
    const { data: photos, error: photoError } = await supabase.from("photos").select("url, public_id")

    if (photoError) {
      console.error("Error fetching photos:", photoError)
      return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
    }

    // Delete backgrounds from Blob
    for (const bg of backgrounds) {
      await deleteFromBlob(bg.url)
    }

    // Delete photos from Blob
    for (const photo of photos) {
      await deleteFromBlob(photo.url)
    }

    // Record the purge in the history
    const { error: purgeError } = await supabase.from("purge_history").insert({
      purged_by: "admin",
      photos_count: photos.length,
      backgrounds_count: backgrounds.length,
    })

    if (purgeError) {
      console.error("Error recording purge history:", purgeError)
    }

    // Clear the database tables
    const { error: clearBgError } = await supabase.from("backgrounds").delete().neq("id", 0) // This will delete all rows

    if (clearBgError) {
      console.error("Error clearing backgrounds table:", clearBgError)
      return NextResponse.json({ error: "Failed to clear backgrounds table" }, { status: 500 })
    }

    const { error: clearPhotoError } = await supabase.from("photos").delete().neq("id", 0) // This will delete all rows

    if (clearPhotoError) {
      console.error("Error clearing photos table:", clearPhotoError)
      return NextResponse.json({ error: "Failed to clear photos table" }, { status: 500 })
    }

    // Revalidate all pages
    revalidatePath("/")
    revalidatePath("/admin")

    return NextResponse.json({
      success: true,
      purged: {
        backgrounds: backgrounds.length,
        photos: photos.length,
      },
    })
  } catch (error) {
    console.error("Error purging data:", error)
    return NextResponse.json({ error: "Failed to purge data" }, { status: 500 })
  }
}
