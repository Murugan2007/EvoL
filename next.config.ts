import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The company page (static HTML) lives at /about
  async rewrites() {
    return [{ source: "/about", destination: "/about.html" }];
  },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
