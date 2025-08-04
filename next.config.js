/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/openkj/:path*',
        destination: '/api/openkj/:path*',
      },
    ];
  },
};

module.exports = nextConfig;