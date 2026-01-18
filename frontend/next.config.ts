import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // remotePatterns: [
    //   {
    //     protocol: "https",
    //     hostname: "www.figma.com",
    //     pathname: "/api/mcp/asset/**",
    //   },
    //   {
    //     protocol: "https",
    //     hostname: "0zktu15h6i.ufs.sh",
    //     pathname: "/f/**",
    //   },
    //   {
    //     protocol: "https",
    //     hostname: "utfs.io",
    //     pathname: "**",
    //   },
    // ],
    unoptimized: true,
  },
};

export default nextConfig;
