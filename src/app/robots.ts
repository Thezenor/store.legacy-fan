import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://store.legacy-fan.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/lf-admin', '/account', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
