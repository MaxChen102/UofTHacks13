import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
<<<<<<< HEAD
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
=======
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
>>>>>>> 374dbae95cc4b7b2394b2f55c8a4a87ac7a6118a
  },
};

export default nextConfig;
