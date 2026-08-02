/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nova/nova-dex", "@nova/types"],
};

export default nextConfig;
