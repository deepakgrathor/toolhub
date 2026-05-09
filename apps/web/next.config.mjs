/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@toolhub/shared", "@toolhub/db"],
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

export default nextConfig;
