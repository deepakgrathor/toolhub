import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' + 'unsafe-eval'; Cashfree JS SDK + PostHog
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.cashfree.com https://us.i.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      // R2 public bucket, Google avatars (NextAuth)
      "img-src 'self' blob: data: https://*.r2.cloudflarestorage.com https://lh3.googleusercontent.com",
      // next/font/google self-hosts fonts at build time — no external font CDN needed
      "font-src 'self'",
      "connect-src 'self' https://us.i.posthog.com https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@toolhub/shared", "@toolhub/db"],

  compress: true,

  async headers() {
    return [
      {
        // Security headers on every route
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Admin routes: all security headers + no-index
        source: "/admin/:path*",
        headers: [
          ...securityHeaders,
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
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
