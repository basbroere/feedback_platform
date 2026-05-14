import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.homerun.co",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["10.0.0.38"],
};

export default nextConfig;
