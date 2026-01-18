import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
        pathname: "/api/mcp/asset/**",
      },
      {
        // Uploadthing file storage - wildcard for any subdomain
        protocol: "https",
        hostname: "*.ufs.sh",
        pathname: "/f/**",
      },
      {
        // Legacy Uploadthing URLs
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/f/**",
      }
    ],
  },
};

export default nextConfig;
