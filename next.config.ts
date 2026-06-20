import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory confuses Next's workspace-root
  // inference; pin the root to this project explicitly.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
