import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // El logo y las fotos viven en Supabase Storage.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
}

export default nextConfig
