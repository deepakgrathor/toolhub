import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@toolhub/shared", "@toolhub/db"],

  compress: true,

  // Block search engines from indexing admin routes
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  // Image optimisation — allow next/image to serve from R2 + common domains
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Cloudflare R2 public bucket (set CLOUDFLARE_R2_PUBLIC_URL in env)
      ...(process.env.CLOUDFLARE_R2_PUBLIC_URL
        ? [
            {
              protocol: "https",
              hostname: new URL(process.env.CLOUDFLARE_R2_PUBLIC_URL.replace(/^﻿/, "")).hostname,
            },
          ]
        : []),
      // Generic R2 custom domain placeholder (override with real domain)
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      // Google user avatars (NextAuth Google OAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  experimental: {
    // Prevent Next.js from bundling mongoose through webpack.
    // Instead Node.js resolves it via its native require cache so all
    // server files share ONE mongoose singleton — fixing the
    // "mongoose.models is undefined" ESM/CJS interop crash.
    // Note: Next.js 14 uses experimental.serverComponentsExternalPackages;
    //       Next.js 15 renamed this to the top-level serverExternalPackages.
    serverComponentsExternalPackages: [
      "mongoose",
      "bcryptjs",
      "ioredis",
      "bullmq",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
