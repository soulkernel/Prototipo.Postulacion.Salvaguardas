import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
    // Persistent build cache repeatedly failed to reopen on this synced Windows workspace.
    // Compiling without it also keeps CI independent of a local cache snapshot.
    turbopackFileSystemCacheForBuild: false,
  },
  outputFileTracingIncludes: {
    "/documents/*": [
      "./node_modules/@fontsource/noto-sans/files/*latin-400-normal.woff",
      "./node_modules/@fontsource/noto-sans/files/*latin-700-normal.woff",
    ],
  },
};
export default config;
