import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Locale } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SLUGS = [
  'terms',
  'privacy',
  'cookies',
  'shipping',
  'returns',
  'membership',
  'points',
  'referrals',
  'disclaimer',
];

async function getPage(slug: string, locale: string) {
  // Idioma pedido con fallback a español (admin edita ES/EN; doc 11).
  const page = await prisma.legalPage.findUnique({
    where: { slug_locale: { slug, locale: locale as Locale } },
  });
  if (page) return page;
  return prisma.legalPage.findUnique({ where: { slug_locale: { slug, locale: 'es' as Locale } } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPage(slug, locale);
  return { title: page?.title ?? 'Legal', robots: { index: true } };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!SLUGS.includes(slug)) notFound();

  const page = await getPage(slug, locale);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-metal-gold">{page.title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
        {page.body.split('\n').filter(Boolean).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
