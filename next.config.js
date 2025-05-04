const { withContentlayer } = require("next-contentlayer2");

import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  // 禁用链接预加载，防止静态资源循环加载
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "email-attachment.apil.top",
      },
    ],
  },
  // 禁用预加载功能
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*',
        destination: '/docs/:path*',
      },
      {
        source: '/_next/static/:path*',
        destination: '/_next/static/:path*',
      }
    ]
  },
  redirects() {
    return [
      {
        source: "/s",
        destination: "/",
        permanent: true,
      },
      {
        source: "/docs/developer",
        destination: "/docs/developer/installation",
        permanent: true,
      },
      {
        source: "/0",
        destination: "/s/0",
        permanent: true,
      },
      {
        source: "/9",
        destination: "/s/9",
        permanent: true,
      },
      {
        source: "/ai",
        destination: "/s/ai?ref=wrdo",
        permanent: true,
      },
      {
        source: "/cps",
        destination: "/s/cps",
        permanent: true,
      },
      {
        source: "/x",
        destination: "/s/x",
        permanent: true,
      },
      {
        source: "/solo",
        destination: "/s/solo",
        permanent: true,
      },
      {
        source: "/rmbg",
        destination: "/s/rmbg",
        permanent: true,
      },
      {
        source: "/llk",
        destination: "/s/llk",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/docs/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          }
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/site.webmanifest',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          }
        ],
      },
      {
        source: '/_static/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      }
    ];
  }
};

const withPWA = require("next-pwa")({
  dest: "public",
  disable: false,
});

module.exports = withContentlayer(withPWA(nextConfig));
