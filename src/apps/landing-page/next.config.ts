// src/apps/landing-page/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@timelapse/ui', '@timelapse/application'],
}

export default nextConfig
