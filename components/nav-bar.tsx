import Link from "next/link"

export function NavBar() {
  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-lg font-semibold">
              Event Gallery
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium">
              Gallery
            </Link>
            <Link href="/admin" className="px-3 py-2 rounded-md text-sm font-medium">
              Admin
            </Link>
            <Link href="/urls" className="px-3 py-2 rounded-md text-sm font-medium">
              URLs
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
