/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // For serving static HTML
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ];
  },

  // Environment variables that should be exposed to browser
  env: {
    NEXT_PUBLIC_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
  },

  // API routes configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },

  // Optimize images
  images: {
    domains: [
      'cdn.jsdelivr.net',
      'firebasestorage.googleapis.com',
      'serveproxy.com',
    ],
  },

  // Webpack configuration (if needed)
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
