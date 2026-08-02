/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nova/nova-dex", "@nova/types"],
  webpack(config) {
    // Our packages use Node/NodeNext-style ".js" specifiers that point at
    // ".ts" source files (standard for TS ESM) — webpack doesn't resolve
    // that mapping on its own, so tell it to also try .ts/.tsx.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
