/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@modelrank/shared"],
  // Produce a minimal standalone server bundle for the Docker image.
  output: "standalone",
};

export default nextConfig;
