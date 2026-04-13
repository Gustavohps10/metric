import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },

  reactCompiler: true,

  transpilePackages: ['@metric-org/ui', '@metric-org/application'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/gh/homarr-labs/**',
      },
    ],
  },
}

export default nextConfig
