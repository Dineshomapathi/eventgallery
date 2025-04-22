/**
 * Utility function to download a file from a URL
 * Works on both desktop and mobile devices
 */
export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    // Fetch the file as a blob
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()

    // Try using the download attribute (works on most desktop browsers)
    if ("download" in document.createElement("a")) {
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = filename

      // Append to the body, click, and remove
      document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        document.body.removeChild(link)
      }, 100)

      return true
    }

    // For iOS Safari and some other mobile browsers that don't support download attribute
    // Create a blob URL and use the saveAs function if available
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename)
      return true
    }

    // Last resort: open the blob URL in a new tab
    // This might not download the file but at least shows it
    const blobUrl = window.URL.createObjectURL(blob)
    const newWindow = window.open(blobUrl, "_blank")

    // If we couldn't open a new window, try changing location
    if (!newWindow) {
      window.location.href = blobUrl
    }

    // Clean up the blob URL after a delay
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100)

    return true
  } catch (error) {
    console.error("Error downloading file:", error)
    return false
  }
}
