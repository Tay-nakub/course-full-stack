import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Self-contained server output for Docker (apps/web/.next/standalone)
  output: 'standalone',
  // Monorepo: trace from repo root so @coffee/shared (workspace symlink)
  // and shared deps under root node_modules get included in standalone output.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // In production behind Caddy, /api/* is reverse-proxied by Caddy directly to
  // the NestJS container — no Next.js rewrite needed (and useful to skip,
  // because rewrite would otherwise hairpin through the web server).
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
