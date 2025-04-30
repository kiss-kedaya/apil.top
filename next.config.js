const { withContentlayer } = require("next-contentlayer2");

import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
        hostname: "email-attachment.kedaya.xyz",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
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
        destination: "https://kedaya.xyz/s/0",
        permanent: true,
      },
      {
        source: "/9",
        destination: "https://kedaya.xyz/s/9",
        permanent: true,
      },
      {
        source: "/ai",
        destination: "https://kedaya.xyz/s/ai?ref=wrdo",
        permanent: true,
      },
      {
        source: "/cps",
        destination: "https://kedaya.xyz/s/cps",
        permanent: true,
      },
      {
        source: "/x",
        destination: "https://kedaya.xyz/s/x",
        permanent: true,
      },
      {
        source: "/solo",
        destination: "https://kedaya.xyz/s/solo",
        permanent: true,
      },
      {
        source: "/rmbg",
        destination: "https://kedaya.xyz/s/rmbg",
        permanent: true,
      },
      {
        source: "/llk",
        destination: "https://kedaya.xyz/s/llk",
        permanent: true,
      },
    ];
  },
};

const withPWA = require("next-pwa")({
  dest: "public",
  disable: false,
});

module.exports = withContentlayer(withPWA(nextConfig));
