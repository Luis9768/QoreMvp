/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:5000';
    return [
      {
        source: '/api/qa/:path*',
        destination: `${backendUrl}/api/qa/:path*`,
      },
      {
        source: '/evidencias/:path*',
        destination: `${backendUrl}/evidencias/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
