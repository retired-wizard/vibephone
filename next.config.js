/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD_VERSION: `v${Date.now().toString(36)}`,
  },
}

module.exports = nextConfig

