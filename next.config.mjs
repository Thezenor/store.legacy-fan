import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Subidas de imagen/vídeo del admin via Server Actions (límite por defecto: 1 MB).
    serverActions: { bodySizeLimit: '64mb' },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  async redirects() {
    // Early Collector ya no existe: redirección permanente a la landing del club.
    return [
      { source: '/early-collector', destination: '/club', permanent: true },
      { source: '/early-collector/:path*', destination: '/club', permanent: true },
    ];
  },
  async headers() {
    // Cabeceras de seguridad (auditoría 2026-07-02). CSP compatible con la app:
    // Next necesita inline scripts/styles; las imágenes usan data: (BD) y blob:.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      // Reproductores de vídeo de colección (YouTube / Vimeo). El resto de
      // iframes sigue bloqueado por default-src 'self'.
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com",
    ].join('; ');
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Content-Security-Policy', value: csp },
    ];
    return [
      { source: '/(.*)', headers: security },
      // Estáticos de marca: caché fuerte con revalidación en segundo plano.
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
