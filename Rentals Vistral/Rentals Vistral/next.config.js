/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.prophero.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    return config;
  },
  // Turbopack configuration (empty to silence error, webpack config above is still used)
  turbopack: {},
};

module.exports = nextConfig;






