import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { CollectionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Coin } from '@/components/brand/coin';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'collections' });
  return { title: t('title'), description: t('tagline') };
}

// Colecciones vienen de la BD/admin → render dinámico (evita BD en build).
export const dynamic = 'force-dynamic';

const METALS = ['silver', 'gold', 'copper'] as const;

function statusLabel(status: CollectionStatus, t: (k: string) => string): string | null {
  if (status === 'ACTIVA') return t('statusActiva');
  if (status === 'PROXIMA') return t('statusProxima');
  if (status === 'AGOTADA') return t('statusAgotada');
  return null;
}

export default async function ColeccionesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'collections' });

  // Colecciones públicas (no borrador/oculta).
  const collections = await prisma.collection.findMany({
    where: { status: { in: ['ACTIVA', 'PROXIMA', 'AGOTADA'] } },
    orderBy: { sortOrder: 'asc' },
    include: { products: { where: { visible: true }, select: { id: true } } },
  });

  return (
    <section className="animate-fade-in">
      <div className="py-6 text-center sm:py-10">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="mt-4 font-display text-4xl uppercase tracking-wide text-foreground sm:text-6xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted sm:text-base">{t('tagline')}</p>
      </div>

      {collections.length === 0 ? (
        <p className="py-10 text-center text-muted">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col, i) => {
            const label = statusLabel(col.status, t);
            const soon = col.status === 'PROXIMA';
            return (
              <article key={col.id} className="flex flex-col items-center text-center">
                <Coin
                  metal={METALS[i % METALS.length]}
                  serial={col.name.slice(0, 14)}
                  legend={`${col.name.toUpperCase()} · LEGACY FAN ·`}
                  className={`w-[clamp(11rem,30vw,16rem)] ${soon ? 'opacity-35 blur-[1px]' : ''}`}
                />
                <h2 className="mt-5 font-display text-lg uppercase tracking-wide text-foreground">
                  {col.name}
                </h2>
                {label ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gold">
                    ✦ {label}
                    {col.products.length > 0 ? <span className="text-faint"> · {col.products.length}</span> : null}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
