import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-teal-700 mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-8 max-w-md">Sorry, the page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">
        Return to Home
      </Link>
    </div>
  )
}
