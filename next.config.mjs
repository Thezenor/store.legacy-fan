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
};

export default withNextIntl(nextConfig);
