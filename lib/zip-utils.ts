import JSZip from "jszip"

/**
 * Downloads all photos from a time block or day as a zip file
 * @param timeBlock The time block identifier or day identifier
 * @param totalPhotos The total number of photos to download
 * @param isFullDay Whether to download all photos from the day
 * @returns Promise that resolves when the download is complete
 */
export async function downloadAllPhotosAsZip(
  timeBlock: string,
  totalPhotos: number,
  isFullDay = false,
): Promise<boolean> {
  try {
    // Create a new JSZip instance
    const zip = new JSZip()
    const folderName = isFullDay
      ? `event-photos-${timeBlock.split("-").slice(0, 3).join("-")}`
      : `event-photos-${timeBlock}`
    const folder = zip.folder(folderName)

    if (!folder) {
      throw new Error("Failed to create zip folder")
    }

    // Show download preparation message
    const preparingMessage = document.createElement("div")
    preparingMessage.className = "fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded shadow-lg z-50"
    preparingMessage.innerHTML = `
      <div class="flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Preparing download (0/${totalPhotos} photos)...</span>
      </div>
    `
    document.body.appendChild(preparingMessage)

    let downloadedCount = 0

    // For full day downloads, we need to fetch photos from all time blocks
    if (isFullDay) {
      // Extract the date part (YYYY-MM-DD)
      const datePart = timeBlock.split("-").slice(0, 3).join("-")

      // If it's a special event like dinner
      if (timeBlock.includes("-dinner")) {
        await downloadPhotosForTimeBlock(timeBlock, folder, preparingMessage, downloadedCount, totalPhotos, (count) => {
          downloadedCount = count
        })
      } else {
        // Regular day with time blocks
        const timeBlocks = ["8-10", "10-12", "12-14", "14-16", "16-18"]

        for (const block of timeBlocks) {
          const fullTimeBlock = `${datePart}-${block}`

          try {
            // Get count for this time block
            const countResponse = await fetch(`/api/photos/${fullTimeBlock}?page=1&limit=1`)
            if (!countResponse.ok) continue

            const countData = await countResponse.json()
            if (!countData.pagination || countData.pagination.total === 0) continue

            // Download photos for this time block
            await downloadPhotosForTimeBlock(
              fullTimeBlock,
              folder,
              preparingMessage,
              downloadedCount,
              totalPhotos,
              (count) => {
                downloadedCount = count
              },
            )
          } catch (error) {
            console.error(`Error processing time block ${fullTimeBlock}:`, error)
            // Continue with other time blocks even if one fails
          }
        }
      }
    } else {
      // Single time block download
      await downloadPhotosForTimeBlock(timeBlock, folder, preparingMessage, downloadedCount, totalPhotos, (count) => {
        downloadedCount = count
      })
    }

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" })

    // Create a download link
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${folderName}.zip`
    document.body.appendChild(link)
    link.click()

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url)
      document.body.removeChild(link)
      document.body.removeChild(preparingMessage)
    }, 100)

    return true
  } catch (error) {
    console.error("Error downloading photos as zip:", error)

    // Remove the preparing message if it exists
    const preparingMessage = document.querySelector(".fixed.top-4.right-4")
    if (preparingMessage && preparingMessage.parentNode) {
      preparingMessage.parentNode.removeChild(preparingMessage)
    }

    // Show error message
    const errorMessage = document.createElement("div")
    errorMessage.className = "fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded shadow-lg z-50"
    errorMessage.innerHTML = `
      <div class="flex items-center">
        <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Failed to download photos. Please try again.</span>
      </div>
    `
    document.body.appendChild(errorMessage)

    // Remove error message after 5 seconds
    setTimeout(() => {
      document.body.removeChild(errorMessage)
    }, 5000)

    return false
  }
}

/**
 * Helper function to download photos for a specific time block
 */
async function downloadPhotosForTimeBlock(
  timeBlock: string,
  folder: JSZip,
  statusElement: HTMLElement,
  currentCount: number,
  totalCount: number,
  updateCount: (count: number) => void,
): Promise<void> {
  // Calculate how many pages we need to fetch
  const photosPerPage = 50 // Fetch more photos per page for efficiency

  // First, get the count for this time block
  const countResponse = await fetch(`/api/photos/${timeBlock}?page=1&limit=1`)
  if (!countResponse.ok) return

  const countData = await countResponse.json()
  if (!countData.pagination || countData.pagination.total === 0) return

  const blockTotalPhotos = countData.pagination.total
  const totalPages = Math.ceil(blockTotalPhotos / photosPerPage)

  // Fetch all pages of photos for this time block
  for (let page = 1; page <= totalPages; page++) {
    const response = await fetch(`/api/photos/${timeBlock}?page=${page}&limit=${photosPerPage}`)

    if (!response.ok) {
      console.error(`Failed to fetch photos for ${timeBlock}, page ${page}`)
      continue
    }

    const data = await response.json()
    const photos = data.photos || []

    // Download each photo and add it to the zip
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      const photoResponse = await fetch(photo.url)

      if (!photoResponse.ok) {
        console.error(`Failed to fetch photo ${photo.id}`)
        continue
      }

      const photoBlob = await photoResponse.blob()
      const fileName = `${timeBlock}/${photo.id}${getFileExtension(photo.url)}`
      folder.file(fileName, photoBlob)

      currentCount++
      updateCount(currentCount)

      // Update the message every 5 photos
      if (currentCount % 5 === 0 || currentCount === totalCount) {
        statusElement.innerHTML = `
          <div class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Preparing download (${currentCount}/${totalCount} photos)...</span>
          </div>
        `
      }
    }
  }
}

/**
 * Gets the file extension from a URL
 */
function getFileExtension(url: string): string {
  const urlWithoutQuery = url.split("?")[0]
  const parts = urlWithoutQuery.split(".")
  if (parts.length > 1) {
    return `.${parts[parts.length - 1].toLowerCase()}`
  }
  return ".jpg" // Default to .jpg if no extension found
}

/**
 * Counts the total number of photos for a day across all time blocks
 */
export async function countTotalPhotosForDay(date: string): Promise<number> {
  try {
    let totalCount = 0

    // Check if it's a special event like dinner
    if (date.includes("-dinner")) {
      const response = await fetch(`/api/photos/${date}?page=1&limit=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.pagination) {
          totalCount = data.pagination.total
        }
      }
      return totalCount
    }

    // Regular day with time blocks
    const timeBlocks = ["8-10", "10-12", "12-14", "14-16", "16-18"]

    for (const block of timeBlocks) {
      const timeBlock = `${date}-${block}`
      try {
        const response = await fetch(`/api/photos/${timeBlock}?page=1&limit=1`)
        if (response.ok) {
          const data = await response.json()
          if (data.pagination) {
            totalCount += data.pagination.total
          }
        }
      } catch (error) {
        console.error(`Error counting photos for ${timeBlock}:`, error)
      }
    }

    return totalCount
  } catch (error) {
    console.error("Error counting total photos for day:", error)
    return 0
  }
}
