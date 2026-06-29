import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthNav } from '@/components/auth/auth-nav';
import { Wordmark } from '@/components/brand/wordmark';
import { MainNav } from '@/components/brand/main-nav';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import '../globals.css';
// Fuentes de marca auto-alojadas (Cormorant Garamond display + Hanken Grotesk UI)
import '@fontsource/hanken-grotesk/300.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';

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
          <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
            <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between gap-5 px-5 sm:px-6">
              <Link href="/" aria-label={t('siteName')} className="flex-none">
                <Wordmark />
              </Link>
              <MainNav
                menuLabel={t('menu')}
                items={[
                  { href: '/club', label: t('navClub') },
                  { href: '/club/prime', label: 'Prime' },
                  { href: '/club/prestige', label: 'Prestige' },
                ]}
              />
              <div className="flex flex-none items-center gap-3 sm:gap-4">
                <AuthNav
                  isLoggedIn={!!session?.user?.id}
                  accountLabel={t('account')}
                  loginLabel={t('login')}
                  logoutLabel={t('logout')}
                />
                <ThemeToggle label={t('toggleTheme')} />
              </div>
            </div>
          </header>
          <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            {children}
          </main>
          <footer className="border-t border-border px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="hairline-gold mb-8" />
              <div className="flex flex-col items-center gap-4 text-center">
                <Wordmark />
                <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
                  <Link href="/legal/terms" className="hover:text-foreground">{t('legalTerms')}</Link>
                  <Link href="/legal/privacy" className="hover:text-foreground">{t('legalPrivacy')}</Link>
                  <Link href="/legal/cookies" className="hover:text-foreground">{t('legalCookies')}</Link>
                </nav>
                <p className="max-w-2xl text-xs leading-relaxed text-faint">
                  {/* Disclaimer obligatorio (doc 15) */}
                  <DisclaimerText locale={locale} />
                </p>
                <p className="text-[11px] tracking-wide text-faint">
                  © 2026 Legacy Fan · 8 The Green STE R, Dover DE 19901 · info@legacy-fan.com
                </p>
              </div>
            </div>
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
