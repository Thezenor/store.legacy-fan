import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { PriceBlock } from '@/components/commerce/price-block';
import { getPlan } from '@/lib/commerce';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ club: string }>;
}): Promise<Metadata> {
  const { club } = await params;
  const plan = await getPlan(club.toUpperCase());
  return { title: plan?.name ?? 'Club' };
}

// Página de un club creado desde el admin (los built-in Prime/Prestige tienen su propia página).
export default async function ClubDinamicoPage({
  params,
}: {
  params: Promise<{ locale: string; club: string }>;
}) {
  const { locale, club } = await params;
  setRequestLocale(locale);
  const code = club.toUpperCase();
  const plan = await getPlan(code);
  if (!plan || !plan.active) notFound();

  return (
    <section className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold uppercase text-metal-gold sm:text-4xl">{plan.name}</h1>
      {plan.tagline ? <p className="mt-3 text-lg text-foreground">{plan.tagline}</p> : null}

      <PriceBlock club={code} currency="EUR" locale={locale} />

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/checkout?club=${code}&type=join`}
          className="bevel bg-gold px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light"
        >
          Unirme
        </Link>
        <Link
          href={`/checkout?club=${code}&type=reserve`}
          className="border border-gold/40 px-6 py-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-gold-light transition hover:bg-surface-elevated"
        >
          Reservar
        </Link>
      </div>
    </section>
  );
}
