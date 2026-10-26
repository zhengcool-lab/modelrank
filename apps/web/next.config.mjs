import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@modelrank/shared"],
  output: "standalone",
};

// Cloudflare Workers 本地开发适配（dev 时自动注入 req.cloudflare）
initOpenNextCloudflareForDev(nextConfig);

export default nextConfig;
