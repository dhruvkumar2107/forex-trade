/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverExternalPackages: ['metaapi.cloud-sdk'],
  },
};

module.exports = nextConfig;
