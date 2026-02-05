import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.googleapis.com' },
      { protocol: 'https', hostname: 'properties.prod.prophero.com' },
      { protocol: 'https', hostname: '**.prophero.com' },
    ],
  },
  compress: true,
  // Removed turbopack: {} to avoid network interface detection issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    
    if (config.resolve) {
      const path = require('path');
      const designSystemPath = path.resolve(__dirname, 'node_modules/vistral-design-system');
      
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
        // Alias @vistral/design-system to vistral-design-system package
        // Let webpack resolve using package.json exports
        '@vistral/design-system': designSystemPath,
      };
      
      // Configure module resolution for both server and client
      config.resolve.conditionNames = ['import', 'require', 'default'];
      config.resolve.mainFields = isServer ? ['main', 'module'] : ['module', 'main', 'browser'];
      
      // Add extensions
      const extensions = ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.json'];
      config.resolve.extensions = [
        ...extensions.filter(ext => !config.resolve.extensions?.includes(ext)),
        ...(config.resolve.extensions || []),
      ];
    }
    
    return config;
  },
};

export default nextConfig;
