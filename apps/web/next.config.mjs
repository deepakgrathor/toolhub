/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@toolhub/shared", "@toolhub/db"],
  // Prevent Next.js from bundling mongoose (and bcryptjs which also uses
  // native bindings). Instead, Node.js resolves them through its require
  // cache, preserving the expected singleton behaviour and avoiding the
  // ESM/CJS interop issue where `mongoose.models` appears undefined.
  serverExternalPackages: ["mongoose", "bcryptjs"],
};

export default nextConfig;
