import type { NextConfig } from "next";

/**
 * Same-origin API proxy.
 *
 * The backend sets the refresh cookie as `docentia_rt; HttpOnly; Secure; SameSite=Strict;
 * Path=/api/v1/auth` (API_CONTRATO §6.2). When the browser calls the backend on another site
 * (localhost -> onrender.com, or a frontend domain -> API domain), a SameSite=Strict cookie is
 * neither stored from that response nor sent back, so POST /auth/refresh never sees it and every
 * reload ends at the login. Proxying /api/v1/* through this app makes every API call same-origin:
 * the cookie lives on the frontend's own domain, under the same Path, and the contract is unchanged.
 *
 * NEXT_PUBLIC_API_URL stays the real backend URL (it is the proxy target). Set
 * NEXT_PUBLIC_API_PROXY=false only when frontend and backend share a site.
 */
const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/+$/, "");
const useProxy = process.env.NEXT_PUBLIC_API_PROXY !== "false" && /^https?:\/\//.test(BACKEND_API_URL);

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    if (!useProxy) return [];
    return [{ source: "/api/v1/:path*", destination: `${BACKEND_API_URL}/:path*` }];
  },
};

export default nextConfig;
