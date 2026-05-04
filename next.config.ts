import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence Prisma peer dep warnings
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
