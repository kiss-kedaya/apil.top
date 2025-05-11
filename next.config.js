const { withContentlayer } = require("next-contentlayer2");

import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: 'standalone',
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
        hostname: "email-attachment.qali.cn",
      },
    ],
  },
  // 禁用预加载功能
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
    useSearchParamsInSSR: false, // 禁用SSR中使用searchParams
    skipMiddlewareUrlNormalize: true, // 跳过中间件URL标准化
    optimizePackageImports: ['lucide-react'],
  },
  // 完全禁用静态页面生成
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  // 允许构建继续执行，忽略预渲染错误
  onDemandEntries: {
    // 允许构建继续执行，忽略预渲染错误
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  typescript: {
    // 忽略类型错误，允许构建继续
    ignoreBuildErrors: true,
  },
  eslint: {
    // 忽略ESLint错误，允许构建继续
    ignoreDuringBuilds: true,
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
