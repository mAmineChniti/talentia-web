import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    // Reverse proxy: `/backend-api/*` -> Spring Boot's `/api/*` on the same
    // origin, so the browser never makes cross-origin requests (no CORS) and
    // the JSESSIONID auth cookie rides along on every request.
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8089';
    return [
      {
        source: '/backend-api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
