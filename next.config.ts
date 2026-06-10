import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  allowedDevOrigins: [
    'preview-chat-0c8dec09-20fb-4d79-9762-7020dbdbde2a.space-z.ai',
  ],
};

export default nextConfig;
