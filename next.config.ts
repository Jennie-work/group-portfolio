import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const protectedRouteHeaders = [
  ...securityHeaders,
  { key: 'X-Frame-Options', value: 'DENY' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/login', headers: protectedRouteHeaders },
      { source: '/dashboard/:path*', headers: protectedRouteHeaders },
    ];
  },
};

export default nextConfig;
