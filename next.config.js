const { withContentlayer } = require("next-contentlayer2");

import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
        hostname: "email-attachment.apil.top",
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
        destination: "https://apil.top/s/0",
        permanent: true,
      },
      {
        source: "/9",
        destination: "https://apil.top/s/9",
        permanent: true,
      },
      {
        source: "/ai",
        destination: "https://apil.top/s/ai?ref=wrdo",
        permanent: true,
      },
      {
        source: "/cps",
        destination: "https://apil.top/s/cps",
        permanent: true,
      },
      {
        source: "/x",
        destination: "https://apil.top/s/x",
        permanent: true,
      },
      {
        source: "/solo",
        destination: "https://apil.top/s/solo",
        permanent: true,
      },
      {
        source: "/rmbg",
        destination: "https://apil.top/s/rmbg",
        permanent: true,
      },
      {
        source: "/llk",
        destination: "https://apil.top/s/llk",
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
