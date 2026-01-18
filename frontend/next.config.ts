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
        protocol: "https",
        hostname: "0zktu15h6i.ufs.sh",
        pathname: "/f/**",
      }
    ],
  },
};

export default nextConfig;
