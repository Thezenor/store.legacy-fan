import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthNav } from '@/components/auth/auth-nav';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import '../globals.css';

// Fuentes: stack del sistema vía variables CSS (definidas en globals.css).
// TODO(Fase 1): auto-alojar Inter + Cormorant Garamond con next/font/local
// (requiere red limpia o el CA corporativo instalado para descargar los .woff2).

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: { default: t('siteName'), template: `%s · ${t('siteName')}` },
    description: 'Legacy Fan — coleccionismo premium en metales preciosos.',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://store.legacy-fan.com'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'common' });
  const session = await auth();

  return (
    // Modo oscuro por defecto: sin clase `.light` en el render inicial.
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider>
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-display text-xl font-bold text-metal-gold">
                {t('siteName')}
              </Link>
              <div className="flex items-center gap-3">
                <AuthNav
                  isLoggedIn={!!session?.user?.id}
                  accountLabel={t('account')}
                  loginLabel={t('login')}
                  logoutLabel={t('logout')}
                />
                <ThemeToggle label={t('toggleTheme')} />
              </div>
            </nav>
          </header>
          <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted">
            <p className="mx-auto max-w-2xl">
              {/* Disclaimer obligatorio (doc 15) */}
              <DisclaimerText locale={locale} />
            </p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

async function DisclaimerText({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  return <>{t('disclaimer')}</>;
}
