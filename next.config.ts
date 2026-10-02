import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress the package-lock.json warning when repo is inside a monorepo
  turbopack: {
    root: process.cwd(),
  },
  // Ensure server-only modules are not bundled for the client
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
    "groq-sdk",
  ],
};

export default nextConfig;
