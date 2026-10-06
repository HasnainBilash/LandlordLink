import type { NextConfig } from "next";

// Old URLs from before the simpler page structure (Phase 2). Each one now
// lives on a tab or in a dialog of a newer page; redirect so bookmarks and
// old links keep working. Order matters: the first match wins.
const legacyRedirects = [
  ["/dashboard/activity", "/dashboard/reports?tab=activity"],
  ["/dashboard/buildings/new", "/dashboard/buildings"],
  ["/dashboard/buildings/:id/edit", "/dashboard/buildings/:id"],
  ["/dashboard/buildings/:id/quick-setup", "/dashboard/buildings/:id"],
  ["/dashboard/buildings/:id/activity", "/dashboard/buildings/:id?tab=activity"],
  ["/dashboard/buildings/:id/requests", "/dashboard/buildings/:id?tab=requests"],
  ["/dashboard/buildings/:id/notices/:path*", "/dashboard/buildings/:id?tab=notices"],
  ["/dashboard/buildings/:id/floors/:floorId/flats/new", "/dashboard/buildings/:id"],
  ["/dashboard/buildings/:id/floors/:floorId/flats/:flatId/edit", "/dashboard/flats/:flatId"],
  ["/dashboard/buildings/:id/floors/:floorId/flats/:flatId", "/dashboard/flats/:flatId"],
  ["/dashboard/buildings/:id/floors/:path*", "/dashboard/buildings/:id"],
  ["/tenant/notices", "/tenant"],
  ["/tenant/profile/edit", "/tenant/profile"],
  ["/tenant/flats/:flatId/request", "/tenant/buildings"],
] as const;

// Sent with every response. The Content-Security-Policy is set per request
// in src/proxy.ts (it needs a fresh nonce).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Don't advertise the framework.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async redirects() {
    return legacyRedirects.map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
