/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '600mb', // Increase from 50mb to 600mb for large video uploads
    },
    responseLimit: '600mb', // Also increase the response limit
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['vercel-blob.com'],
    unoptimized: true,
  },
};

export default nextConfig;
