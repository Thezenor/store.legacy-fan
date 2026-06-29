// Builders de datos estructurados schema.org (doc 11): Product/Offer, FAQPage, BreadcrumbList.

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://store.legacy-fan.com';

export function productOffer(opts: {
  name: string;
  description: string;
  url: string;
  priceCents: number;
  currency: 'EUR' | 'USD';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: opts.name,
    description: opts.description,
    brand: { '@type': 'Brand', name: 'Legacy Fan' },
    offers: {
      '@type': 'Offer',
      url: opts.url,
      priceCurrency: opts.currency,
      price: (opts.priceCents / 100).toFixed(2),
      availability: 'https://schema.org/PreOrder',
    },
  };
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function breadcrumb(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${BASE}${t.path}`,
    })),
  };
}

export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Legacy Fan',
    url: BASE,
  };
}
