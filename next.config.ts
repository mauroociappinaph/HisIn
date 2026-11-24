import type { NextConfig } from "next";
import { loadLocalEnv } from "./src/shared/lib/load-env";

loadLocalEnv();

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The app is developed over the LAN as well as on localhost, and Next blocks the
  // dev socket for origins it does not know: the HMR websocket failed on 192.168.x
  // with no visible cause. Listing them here is the documented way to allow it.
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.0.115"],
  partialPrefetching: true,
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
