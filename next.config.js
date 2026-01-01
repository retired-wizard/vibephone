/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD_VERSION: `v${Date.now().toString(36)}`,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'geolocation=*, accelerometer=*, gyroscope=*, magnetometer=*',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

